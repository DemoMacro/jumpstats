import { createAuthEndpoint, APIError } from "better-auth/api";
import { getSessionFromCtx, sessionMiddleware } from "better-auth/api";
import { UpdateDomainBodySchema, type Domain } from "../../../../types/domain";
import { canAccessDomain } from "../permissions";

export const updateDomain = () => {
  return createAuthEndpoint(
    "/domain/update",
    {
      method: "POST",
      body: UpdateDomainBodySchema,
      use: [sessionMiddleware],
      metadata: {
        openapi: {
          description: "Update a domain",
          responses: {
            "200": {
              description: "Domain updated successfully",
            },
          },
        },
      },
    },
    async (ctx) => {
      const session = await getSessionFromCtx(ctx);
      if (!session) {
        throw new APIError("UNAUTHORIZED", {
          message: "Authentication required",
        });
      }

      const { domainId, domainName, status } = ctx.body;

      // Get domain
      const domain = await ctx.context.adapter.findOne<Domain>({
        model: "domain",
        where: [{ field: "id", value: domainId }],
      });

      if (!domain) {
        throw new APIError("NOT_FOUND", {
          message: "Domain not found",
        });
      }

      // Permission check
      const hasPermission = await canAccessDomain(ctx, domain, session);
      if (!hasPermission) {
        throw new APIError("FORBIDDEN", {
          message: "You do not have permission to update this domain",
        });
      }

      // Prepare update data
      const updateData: Partial<Omit<Domain, "id" | "createdAt" | "userId" | "organizationId">> = {
        updatedAt: new Date(),
      };

      if (domainName !== undefined) {
        // If domain name is changed, reset verification
        updateData.domainName = domainName;
        updateData.status = "pending";
        updateData.verificationToken = `jumpstats-verify-${generateVerificationToken()}`;
        updateData.verifiedAt = null;
      }

      if (status !== undefined) {
        updateData.status = status;
      }

      // Update domain
      const updated = await ctx.context.adapter.update({
        model: "domain",
        where: [{ field: "id", value: domainId }],
        update: updateData,
      });

      return ctx.json({
        success: true,
        domain: updated,
      });
    },
  );
};

const generateVerificationToken = (): string => {
  return crypto
    .getRandomValues(new Uint8Array(16))
    .reduce((str, byte) => str + (byte % 36).toString(36), "");
};

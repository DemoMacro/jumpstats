import { createAuthEndpoint, APIError } from "better-auth/api";
import { getSessionFromCtx, sessionMiddleware } from "better-auth/api";
import { DomainQuerySchema, type Domain } from "../../../../types/domain";
import { canAccessDomain } from "../permissions";

export const getDomain = () => {
  return createAuthEndpoint(
    "/domain/get",
    {
      method: "GET",
      query: DomainQuerySchema,
      use: [sessionMiddleware],
      metadata: {
        openapi: {
          description: "Get a single domain",
          responses: {
            "200": {
              description: "Domain retrieved successfully",
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

      const domainId = ctx.query?.domainId;

      if (!domainId) {
        throw new APIError("BAD_REQUEST", {
          message: "Domain ID is required",
        });
      }

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
          message: "You do not have permission to access this domain",
        });
      }

      return ctx.json(domain);
    },
  );
};

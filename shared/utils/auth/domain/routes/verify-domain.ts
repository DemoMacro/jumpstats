import { createAuthEndpoint, APIError } from "better-auth/api";
import { getSessionFromCtx, sessionMiddleware } from "better-auth/api";
import { VerifyDomainSchema, type Domain } from "../../../../types/domain";
import { canAccessDomain } from "../permissions";
import { createDNSManager, isTxtRecord } from "undns";
import dohDriver from "undns/drivers/doh";

export const verifyDomain = () => {
  return createAuthEndpoint(
    "/domain/verify",
    {
      method: "POST",
      body: VerifyDomainSchema,
      use: [sessionMiddleware],
      metadata: {
        openapi: {
          description: "Verify domain ownership via DNS TXT record",
          responses: {
            "200": {
              description: "Domain verified successfully",
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

      const { domainId } = ctx.body;

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
          message: "You do not have permission to verify this domain",
        });
      }

      if (!domain.verificationToken) {
        throw new APIError("BAD_REQUEST", {
          message: "No verification token found for this domain",
        });
      }

      try {
        // Create DNS manager with DoH driver
        const dns = createDNSManager({
          driver: dohDriver({
            endpoint: "https://dns.google/resolve",
            timeout: 3000,
          }),
        });

        // Resolve TXT records
        const records = await dns.getRecords(domain.domainName, { type: "TXT" });

        // Check if verification token exists in TXT records
        const expectedToken = domain.verificationToken;
        const verified = records.some((record) => {
          // Use type guard to check if record is TXT record
          if (isTxtRecord(record)) {
            return record.entries?.some((entry: string) => entry.includes(expectedToken));
          }
          return false;
        });

        if (!verified) {
          throw new APIError("BAD_REQUEST", {
            message: "DNS verification failed. TXT record not found or incorrect.",
          });
        }

        // Update domain status to active
        const updated = await ctx.context.adapter.update({
          model: "domain",
          where: [{ field: "id", value: domainId }],
          update: {
            status: "active",
            verifiedAt: new Date(),
          },
        });

        return ctx.json({
          success: true,
          domain: updated,
        });
      } catch (error) {
        if (error instanceof APIError) {
          throw error;
        }

        throw new APIError("INTERNAL_SERVER_ERROR", {
          message: "Failed to verify domain. Please check your DNS configuration.",
        });
      }
    },
  );
};

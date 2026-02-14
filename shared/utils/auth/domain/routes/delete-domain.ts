import { createAuthEndpoint, APIError } from "better-auth/api";
import { getSessionFromCtx, sessionMiddleware } from "better-auth/api";
import { DomainQuerySchema, type Domain } from "../../../../types/domain";
import { canAccessDomain } from "../permissions";

const deleteDomainBodySchema = DomainQuerySchema.pick({
  domainId: true,
}).required();

export const deleteDomain = () => {
  return createAuthEndpoint(
    "/domain/delete",
    {
      method: "POST",
      body: deleteDomainBodySchema,
      use: [sessionMiddleware],
      metadata: {
        openapi: {
          description: "Delete a domain",
          responses: {
            "200": {
              description: "Domain deleted successfully",
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

      const domainId = ctx.body.domainId;

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
          message: "You do not have permission to delete this domain",
        });
      }

      // Check if domain has links
      const linksCount = await ctx.context.adapter.count({
        model: "link",
        where: [{ field: "domainId", value: domainId }],
      });

      if (linksCount > 0) {
        throw new APIError("CONFLICT", {
          message: `Cannot delete domain with ${linksCount} links. Please delete all links first.`,
        });
      }

      // Delete domain
      await ctx.context.adapter.delete({
        model: "domain",
        where: [{ field: "id", value: domainId }],
      });

      return ctx.json({
        success: true,
      });
    },
  );
};

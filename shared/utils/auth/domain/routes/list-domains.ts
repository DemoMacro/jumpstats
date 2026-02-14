import { createAuthEndpoint, APIError } from "better-auth/api";
import { getSessionFromCtx, sessionMiddleware } from "better-auth/api";
import { DomainQuerySchema, type Domain } from "../../../../types/domain";
import { buildDomainWhereConditions } from "../permissions";

export const listDomains = () => {
  return createAuthEndpoint(
    "/domain/list",
    {
      method: "GET",
      query: DomainQuerySchema,
      use: [sessionMiddleware],
      metadata: {
        openapi: {
          description: "List domains for the current user",
          responses: {
            "200": {
              description: "Domains retrieved successfully",
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

      const organizationId = ctx.query?.organizationId;
      const limit = ctx.query?.limit ?? 20;
      const offset = ctx.query?.offset ?? 0;
      const status = ctx.query?.status;

      // Build where conditions based on user role
      const whereConditions = await buildDomainWhereConditions({
        userId: session.user.id,
        userRole: session.user.role,
        organizationId,
        status,
        adapter: ctx.context.adapter,
      });

      // Fetch domains with pagination
      const domains = await ctx.context.adapter.findMany<Domain>({
        model: "domain",
        where: whereConditions,
        limit,
        offset,
        sortBy: {
          field: "createdAt",
          direction: "desc",
        },
      });

      // Get total count
      const total = await ctx.context.adapter.count({
        model: "domain",
        where: whereConditions,
      });

      return ctx.json({
        domains,
        total,
      });
    },
  );
};

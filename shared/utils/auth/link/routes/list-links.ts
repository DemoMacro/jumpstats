import { createAuthEndpoint, APIError } from "better-auth/api";
import { getSessionFromCtx, sessionMiddleware } from "better-auth/api";
import { LinkQuerySchema, type LinkWithDetails } from "../../../../types/link";
import { buildLinkWhereConditions } from "../permissions";

export const listLinks = () => {
  return createAuthEndpoint(
    "/link/list",
    {
      method: "GET",
      query: LinkQuerySchema,
      use: [sessionMiddleware],
      metadata: {
        openapi: {
          description: "List links for the current user",
          responses: {
            "200": {
              description: "Links retrieved successfully",
              content: {
                "application/json": {
                  schema: {
                    type: "array",
                    items: {
                      type: "object",
                    },
                  },
                },
              },
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
      const whereConditions = await buildLinkWhereConditions({
        userId: session.user.id,
        userRole: session.user.role,
        organizationId,
        status,
        adapter: ctx.context.adapter,
      });

      // Build join options - only join when needed
      // Personal mode: no joins needed
      // Organization mode: join user and organization data
      // Global admin: always join to show full context
      const shouldJoin = session.user.role === "admin" || organizationId;

      // Fetch links with pagination and optional joins
      const links = await ctx.context.adapter.findMany<LinkWithDetails>({
        model: "link",
        where: whereConditions,
        limit,
        offset,
        sortBy: {
          field: "createdAt",
          direction: "desc",
        },
        ...(shouldJoin
          ? {
              join: {
                user: true,
                organization: true,
              },
            }
          : {}),
      });

      // Get total count
      const total = await ctx.context.adapter.count({
        model: "link",
        where: whereConditions,
      });

      return ctx.json({
        links,
        total,
      });
    },
  );
};

import { createAuthEndpoint, APIError } from "better-auth/api";
import { getSessionFromCtx, sessionMiddleware } from "better-auth/api";
import { LinkQuerySchema, type Link } from "../../../../types/link";
import { canAccessLink } from "../permissions";

export const getLink = () => {
  return createAuthEndpoint(
    "/link/get",
    {
      method: "GET",
      query: LinkQuerySchema.pick({ linkId: true }),
      use: [sessionMiddleware],
      metadata: {
        openapi: {
          description: "Get a single link by ID",
          responses: {
            "200": {
              description: "Link retrieved successfully",
              content: {
                "application/json": {
                  schema: {
                    type: "object",
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
          message: "You don't have permission to access this link",
        });
      }

      const linkId = ctx.query?.linkId;
      if (!linkId) {
        throw new APIError("BAD_REQUEST", {
          message: "Link not found",
        });
      }

      const link = await ctx.context.adapter.findOne<Link>({
        model: "link",
        where: [
          {
            field: "id",
            value: linkId,
          },
        ],
      });

      if (!link) {
        throw new APIError("NOT_FOUND", {
          message: "Link not found",
        });
      }

      // Permission check
      const hasPermission = await canAccessLink(ctx, link, session);
      if (!hasPermission) {
        throw new APIError("FORBIDDEN", {
          message: "You don't have permission to access this link",
        });
      }

      // Construct full URLs
      const baseURL = ctx.context.baseURL;
      const shortUrl = `${baseURL}/s/${link.shortCode}`;
      const qrUrl = `${baseURL}/qr/${link.shortCode}`;

      return ctx.json({
        ...link,
        shortUrl,
        qrUrl,
      } as Link & { shortUrl: string; qrUrl: string });
    },
  );
};

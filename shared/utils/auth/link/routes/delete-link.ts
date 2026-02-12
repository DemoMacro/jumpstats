import { createAuthEndpoint, APIError } from "better-auth/api";
import { getSessionFromCtx, sessionMiddleware } from "better-auth/api";
import { LinkQuerySchema, type Link } from "../../../../types/link";
import { canAccessLink } from "../permissions";

const deleteLinkBodySchema = LinkQuerySchema.pick({ linkId: true }).required();

export const deleteLink = () => {
  return createAuthEndpoint(
    "/link/delete",
    {
      method: "POST",
      body: deleteLinkBodySchema,
      use: [sessionMiddleware],
      metadata: {
        openapi: {
          description: "Delete a link",
          responses: {
            "200": {
              description: "Link deleted successfully",
              content: {
                "application/json": {
                  schema: {
                    type: "object",
                    properties: {
                      success: {
                        type: "boolean",
                      },
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

      const linkId = ctx.body.linkId;

      // Get the link
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
          message: "You don't have permission to delete this link",
        });
      }

      // Delete the link
      await ctx.context.adapter.delete({
        model: "link",
        where: [
          {
            field: "id",
            value: linkId,
          },
        ],
      });

      return ctx.json({
        success: true,
      });
    },
  );
};

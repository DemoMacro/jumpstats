import { createAuthEndpoint, APIError } from "better-auth/api";
import { getSessionFromCtx, sessionMiddleware } from "better-auth/api";
import { LinkQuerySchema, type Link } from "../../../../types/link";
import { canAccessLink } from "../permissions";
import type { Domain } from "../../../../types/domain";
import { removeLink } from "../cache";

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

      // Get domainName for cache removal before deleting
      let domainName: string;
      if (link.domainId) {
        const domain = await ctx.context.adapter.findOne<Domain>({
          model: "domain",
          where: [
            {
              field: "id",
              value: link.domainId,
            },
          ],
        });
        domainName = domain?.domainName || new URL(ctx.context.baseURL).hostname;
      } else {
        domainName = new URL(ctx.context.baseURL).hostname;
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

      // Remove from cache (non-blocking, don't await)
      removeLink(link.shortCode, domainName).catch((error) => {
        console.error("Failed to remove link cache:", error);
      });

      return ctx.json({
        success: true,
      });
    },
  );
};

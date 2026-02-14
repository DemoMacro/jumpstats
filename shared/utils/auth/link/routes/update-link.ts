import { createAuthEndpoint, APIError } from "better-auth/api";
import { getSessionFromCtx, sessionMiddleware } from "better-auth/api";
import { UpdateLinkBodySchema, type Link } from "../../../../types/link";
import { canAccessLink } from "../permissions";
import type { Domain } from "../../../../types/domain";
import { canAccessDomain } from "../../domain/permissions";

export const updateLink = () => {
  return createAuthEndpoint(
    "/link/update",
    {
      method: "POST",
      body: UpdateLinkBodySchema,
      use: [sessionMiddleware],
      metadata: {
        openapi: {
          description: "Update an existing link",
          responses: {
            "200": {
              description: "Link updated successfully",
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
          message: "Authentication required",
        });
      }

      const { linkId, ...updateData } = ctx.body;

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
          message: "You don't have permission to update this link",
        });
      }

      // Validate domainId if being updated
      if ("domainId" in updateData && updateData.domainId !== undefined) {
        const newDomainId = updateData.domainId;

        if (newDomainId !== null) {
          const domain = await ctx.context.adapter.findOne<Domain>({
            model: "domain",
            where: [
              {
                field: "id",
                value: newDomainId,
              },
            ],
          });

          if (!domain) {
            throw new APIError("NOT_FOUND", {
              message: "Domain not found",
            });
          }

          if (domain.status !== "active") {
            throw new APIError("BAD_REQUEST", {
              message: "Domain is not active. Only active domains can be used for links",
            });
          }

          // Check user has permission to use this domain
          const hasDomainPermission = await canAccessDomain(ctx, domain, session);
          if (!hasDomainPermission) {
            throw new APIError("FORBIDDEN", {
              message: "You don't have permission to use this domain",
            });
          }

          // Check organization match
          if (domain.organizationId !== link.organizationId) {
            throw new APIError("BAD_REQUEST", {
              message: "Domain organization must match link organization",
            });
          }
        }
      }

      // Update the link
      const updatedLink = await ctx.context.adapter.update<Link>({
        model: "link",
        where: [
          {
            field: "id",
            value: linkId,
          },
        ],
        update: {
          ...updateData,
          updatedAt: new Date(),
        },
      });

      if (!updatedLink) {
        throw new APIError("NOT_FOUND", {
          message: "Link not found",
        });
      }

      // Construct full URLs
      const baseURL = ctx.context.baseURL;
      const shortUrl = `${baseURL}/s/${updatedLink.shortCode}`;
      const qrUrl = `${baseURL}/qr/${updatedLink.shortCode}`;

      return ctx.json({
        ...updatedLink,
        shortUrl,
        qrUrl,
      } as Link & { shortUrl: string; qrUrl: string });
    },
  );
};

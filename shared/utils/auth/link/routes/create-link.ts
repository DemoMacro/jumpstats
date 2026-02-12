import { createAuthEndpoint, APIError } from "better-auth/api";
import { getSessionFromCtx } from "better-auth/api";
import { CreateLinkSchema, type Link } from "../../../../types/link";
import type { GenericEndpointContext } from "better-auth";
import type { Member } from "better-auth/plugins";

export const createLink = () => {
  return createAuthEndpoint(
    "/link/create",
    {
      method: "POST",
      body: CreateLinkSchema,
      metadata: {
        openapi: {
          description: "Create a new short link",
          responses: {
            "200": {
              description: "Link created successfully",
              content: {
                "application/json": {
                  schema: {
                    type: "object",
                    properties: {
                      id: { type: "string" },
                      shortCode: { type: "string" },
                      shortUrl: { type: "string" },
                      qrUrl: { type: "string" },
                      originalUrl: { type: "string" },
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
      // Optional authentication - allow anonymous link creation
      const session = await getSessionFromCtx(ctx);

      const { organizationId, originalUrl, title, description, expiresAt } = ctx.body;

      // Check organization membership if provided
      if (organizationId) {
        if (!session?.user) {
          throw new APIError("UNAUTHORIZED", {
            message: "Authentication required for organization links",
          });
        }

        const member = await ctx.context.adapter.findOne<Member>({
          model: "member",
          where: [
            {
              field: "organizationId",
              value: organizationId,
            },
            {
              field: "userId",
              value: session.user.id,
            },
          ],
        });

        if (!member) {
          throw new APIError("FORBIDDEN", {
            message: "You are not a member of this organization",
          });
        }
      }

      // Generate unique short code
      const shortCode = await generateUniqueShortCode(ctx);

      const newLink = {
        shortCode,
        originalUrl,
        userId: session?.user?.id || null,
        organizationId: organizationId || null,
        title: title || null,
        description: description || null,
        status: "active" as const,
        expiresAt: expiresAt || null,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const link = await ctx.context.adapter.create<typeof newLink & { id: string }>({
        model: "link",
        data: newLink,
      });

      // Construct full URLs
      const baseURL = ctx.context.baseURL;
      const shortUrl = `${baseURL}/s/${shortCode}`;
      const qrUrl = `${baseURL}/qr/${shortCode}`;

      return ctx.json({
        ...link,
        shortUrl,
        qrUrl,
      } as Link & { shortUrl: string; qrUrl: string });
    },
  );
};

/**
 * Generate a unique short code with retry logic
 */
async function generateUniqueShortCode(
  ctx: GenericEndpointContext,
  length = 6,
  maxRetries = 10,
): Promise<string> {
  const { randomBytes } = await import("node:crypto");

  for (let i = 0; i < maxRetries; i++) {
    const shortCode = randomBytes(length).toString("base64url").substring(0, length);

    // Check if already exists
    const existing = await ctx.context.adapter.findOne<Link>({
      model: "link",
      where: [
        {
          field: "shortCode",
          value: shortCode,
        },
      ],
    });

    if (!existing) {
      return shortCode;
    }
  }

  throw new Error("Failed to generate unique short code");
}

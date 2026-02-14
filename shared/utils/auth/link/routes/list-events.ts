import { createAuthEndpoint, APIError } from "better-auth/api";
import { getSessionFromCtx, sessionMiddleware } from "better-auth/api";
import { z } from "zod";
import type { Link } from "../../../../types/link";
import { canAccessLink } from "../permissions";
import { chdb } from "../../../../../server/utils/database";

const EventsQuerySchema = z.object({
  linkId: z.string(),
  start: z.string().optional(),
  end: z.string().optional(),
  limit: z.coerce.number().min(1).max(1000).default(50),
  offset: z.coerce.number().min(0).default(0),
});

export const listEvents = () => {
  return createAuthEndpoint(
    "/link/events",
    {
      method: "GET",
      query: EventsQuerySchema,
      use: [sessionMiddleware],
      metadata: {
        openapi: {
          description: "List click events for a link",
          responses: {
            "200": {
              description: "Events retrieved successfully",
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

      const { linkId, start, end, limit, offset } = ctx.query;

      // Verify link exists and user has access
      const link = await ctx.context.adapter.findOne<Link>({
        model: "link",
        where: [{ field: "id", value: linkId }],
      });

      if (!link) {
        throw new APIError("NOT_FOUND", {
          message: "Link not found",
        });
      }

      const hasAccess = await canAccessLink(ctx, link, session);
      if (!hasAccess) {
        throw new APIError("FORBIDDEN", {
          message: "You do not have access to this link",
        });
      }

      // Build base query with linkId filter
      let query = chdb
        .table("clickEvents")
        .where("linkId", "eq", linkId)
        .orderBy("timestamp", "DESC")
        .limit(limit)
        .offset(offset);

      // Apply time range filters
      if (start) {
        query = query.where("timestamp", "gte", start);
      }
      if (end) {
        query = query.where("timestamp", "lte", end);
      }

      // Select non-sensitive fields only
      const events = await query
        .select([
          "id",
          "timestamp",
          "shortCode",
          "originalUrl",
          "browserName",
          "browserType",
          "osName",
          "deviceType",
          "deviceVendor",
          "deviceModel",
          "isBot",
          "country",
          "countryCode",
          "region",
          "regionCode",
          "city",
          "timezone",
          "isp",
          "org",
          "asn",
          "accuracyRadius",
          "isProxy",
          "utmSource",
          "utmMedium",
          "utmCampaign",
          "utmTerm",
          "utmContent",
          "utmId",
        ])
        .execute();

      // Get total count for pagination
      let countQuery = chdb.table("clickEvents").where("linkId", "eq", linkId);
      if (start) {
        countQuery = countQuery.where("timestamp", "gte", start);
      }
      if (end) {
        countQuery = countQuery.where("timestamp", "lte", end);
      }

      const countResult = await countQuery.count("id", "total").execute();
      const total = countResult[0]?.total ?? 0;

      return ctx.json({
        events,
        total,
        limit,
        offset,
      });
    },
  );
};

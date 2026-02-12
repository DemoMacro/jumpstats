import { createAuthEndpoint, APIError } from "better-auth/api";
import { getSessionFromCtx, sessionMiddleware } from "better-auth/api";
import { z } from "zod";
import type { Link } from "../../../../types/link";
import { canAccessLink } from "../permissions";
import { chdb } from "../../../../../server/utils/database";

// GroupBy options matching Dub.co API
const AnalyticsGroupBySchema = z.enum([
  "count",
  "timeseries",
  "countries",
  "cities",
  "devices",
  "browsers",
  "os",
  "utm_sources",
  "utm_mediums",
  "utm_campaigns",
  "utm_terms",
  "utm_contents",
  "referers",
]);

const AnalyticsQuerySchema = z.object({
  linkId: z.string(),
  groupBy: AnalyticsGroupBySchema.default("count"),
  start: z.string().optional(),
  end: z.string().optional(),
});

export const getAnalytics = () => {
  return createAuthEndpoint(
    "/link/analytics",
    {
      method: "GET",
      query: AnalyticsQuerySchema,
      use: [sessionMiddleware],
      metadata: {
        openapi: {
          description: "Retrieve analytics for a link",
          responses: {
            "200": {
              description: "Analytics retrieved successfully",
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

      const { linkId, groupBy, start, end } = ctx.query;

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
      const buildBaseQuery = () => {
        let query = chdb.table("clickEvents").where("linkId", "eq", linkId);
        if (start) {
          query = query.where("timestamp", "gte", start);
        }
        if (end) {
          query = query.where("timestamp", "lte", end);
        }
        return query;
      };

      // Execute query based on groupBy
      switch (groupBy) {
        case "count": {
          const result = await buildBaseQuery().count("id", "totalClicks").execute();
          return ctx.json({
            totalClicks: result[0]?.totalClicks ?? 0,
          });
        }

        case "timeseries": {
          const results = await buildBaseQuery()
            .count("id", "clicks")
            .groupByTimeInterval("timestamp", "1 day")
            .execute();
          return ctx.json({ data: results });
        }

        case "countries": {
          const results = await buildBaseQuery()
            .count("id", "clicks")
            .groupBy("country")
            .orderBy("clicks", "DESC")
            .limit(50)
            .execute();
          return ctx.json({ data: results });
        }

        case "cities": {
          const results = await buildBaseQuery()
            .count("id", "clicks")
            .groupBy("city")
            .orderBy("clicks", "DESC")
            .limit(50)
            .execute();
          return ctx.json({ data: results });
        }

        case "devices": {
          const results = await buildBaseQuery()
            .count("id", "clicks")
            .groupBy("deviceType")
            .orderBy("clicks", "DESC")
            .limit(50)
            .execute();
          return ctx.json({ data: results });
        }

        case "browsers": {
          const results = await buildBaseQuery()
            .count("id", "clicks")
            .groupBy("browserName")
            .orderBy("clicks", "DESC")
            .limit(50)
            .execute();
          return ctx.json({ data: results });
        }

        case "os": {
          const results = await buildBaseQuery()
            .count("id", "clicks")
            .groupBy("osName")
            .orderBy("clicks", "DESC")
            .limit(50)
            .execute();
          return ctx.json({ data: results });
        }

        case "utm_sources": {
          const results = await buildBaseQuery()
            .count("id", "clicks")
            .groupBy("utmSource")
            .orderBy("clicks", "DESC")
            .limit(50)
            .execute();
          return ctx.json({ data: results });
        }

        case "utm_mediums": {
          const results = await buildBaseQuery()
            .count("id", "clicks")
            .groupBy("utmMedium")
            .orderBy("clicks", "DESC")
            .limit(50)
            .execute();
          return ctx.json({ data: results });
        }

        case "utm_campaigns": {
          const results = await buildBaseQuery()
            .count("id", "clicks")
            .groupBy("utmCampaign")
            .orderBy("clicks", "DESC")
            .limit(50)
            .execute();
          return ctx.json({ data: results });
        }

        case "utm_terms": {
          const results = await buildBaseQuery()
            .count("id", "clicks")
            .groupBy("utmTerm")
            .orderBy("clicks", "DESC")
            .limit(50)
            .execute();
          return ctx.json({ data: results });
        }

        case "utm_contents": {
          const results = await buildBaseQuery()
            .count("id", "clicks")
            .groupBy("utmContent")
            .orderBy("clicks", "DESC")
            .limit(50)
            .execute();
          return ctx.json({ data: results });
        }

        case "referers": {
          const results = await buildBaseQuery()
            .count("id", "clicks")
            .groupBy("referrer")
            .orderBy("clicks", "DESC")
            .limit(50)
            .execute();
          return ctx.json({ data: results });
        }

        default:
          throw new APIError("BAD_REQUEST", {
            message: "Invalid groupBy parameter",
          });
      }
    },
  );
};

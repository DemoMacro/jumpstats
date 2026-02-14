import { db } from "~~/server/utils/database";
import { sendRedirect } from "h3";
import { trackClickEvent } from "~~/server/utils/analytics/track";

export default defineEventHandler(async (event) => {
  const shortCode = getRouterParam(event, "shortCode");

  if (!shortCode) {
    throw createError({
      statusCode: 400,
      statusMessage: "Short code is required",
    });
  }

  const link = await db
    .selectFrom("link")
    .selectAll()
    .where("shortCode", "=", shortCode)
    .executeTakeFirst();

  if (!link) {
    throw createError({
      statusCode: 404,
      statusMessage: "Short link not found",
    });
  }

  if (link.status !== "active") {
    throw createError({
      statusCode: 404,
      statusMessage: "Short link is inactive",
    });
  }

  if (link.expiresAt && link.expiresAt < new Date()) {
    throw createError({
      statusCode: 404,
      statusMessage: "Short link has expired",
    });
  }

  // Get requested host from headers
  const host = getRequestHost(event);

  // If link has custom domain, verify it matches requested host
  if (link.domainId) {
    const domain = await db
      .selectFrom("domain")
      .selectAll()
      .where("id", "=", link.domainId)
      .executeTakeFirst();

    if (!domain || domain.status !== "active") {
      throw createError({
        statusCode: 404,
        statusMessage: "Custom domain not verified or not found",
      });
    }

    if (host !== domain.domainName) {
      throw createError({
        statusCode: 404,
        statusMessage: "Domain does not match requested host",
      });
    }
  }

  // Track click event in background (non-blocking)
  event.waitUntil(trackClickEvent(event, link));

  // Always redirect to the original URL
  return sendRedirect(event, link.originalUrl, 302);
});

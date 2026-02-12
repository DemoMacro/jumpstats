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

  // Track click event in background (non-blocking)
  event.waitUntil(trackClickEvent(event, link));

  return sendRedirect(event, link.originalUrl, 302);
});

import { db } from "~~/server/utils/database";
import { sendRedirect } from "h3";
import { trackClickEvent } from "~~/server/utils/analytics/track";
import { getLink, setLink } from "~~/shared/utils/auth/link/cache";

export default defineEventHandler(async (event) => {
  const shortCode = getRouterParam(event, "shortCode");

  if (!shortCode) {
    throw createError({
      statusCode: 400,
      statusMessage: "Short code is required",
    });
  }

  // Get requested host from headers (may be default or custom domain)
  const host = getRequestHost(event);

  // Try to get link from cache first
  let link = await getLink(shortCode, host);

  // Cache miss - query database
  if (!link) {
    const dbLink = await db
      .selectFrom("link")
      .selectAll()
      .where("shortCode", "=", shortCode)
      .executeTakeFirst();

    if (!dbLink) {
      throw createError({
        statusCode: 404,
        statusMessage: "Short link not found",
      });
    }

    // Get the correct domainName for caching
    let domainName = host; // Default to requested host

    // If link has custom domain, query and get domainName
    if (dbLink.domainId) {
      const domain = await db
        .selectFrom("domain")
        .select("domainName")
        .where("id", "=", dbLink.domainId)
        .executeTakeFirst();

      if (!domain) {
        throw createError({
          statusCode: 404,
          statusMessage: "Custom domain not found",
        });
      }

      domainName = domain.domainName;
    }

    // Set link to cache with correct domainName
    await setLink(shortCode, domainName, dbLink);

    link = { ...dbLink, domainName };
  }

  // Validate link status
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

  // If link has custom domain, verify it matches requested host
  if (link.domainId) {
    // Use cached domainName if available
    const domainName = link.domainName;

    // Verify the domain is active
    const domain = await db
      .selectFrom("domain")
      .selectAll()
      .where("domainName", "=", domainName)
      .executeTakeFirst();

    if (!domain || domain.status !== "active") {
      throw createError({
        statusCode: 404,
        statusMessage: "Custom domain not verified or not found",
      });
    }

    if (host !== domainName) {
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

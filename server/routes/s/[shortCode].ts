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

  // Cache miss - query database with LEFT JOIN
  if (!link) {
    // Single query with LEFT JOIN to get both link and domain data
    const result = await db
      .selectFrom("link")
      .leftJoin("domain", "domain.id", "link.domainId")
      .selectAll("link")
      .select(["domain.domainName", "domain.status as domainStatus"])
      .where("link.shortCode", "=", shortCode)
      .executeTakeFirst();

    if (!result) {
      throw createError({
        statusCode: 404,
        statusMessage: "Short link not found",
      });
    }

    // Extract domainName, domainStatus (use host if null) and link data
    const { domainName, domainStatus, ...linkData } = result;
    const finalDomainName = domainName ?? host;

    // If link has custom domain but domainName is null, domain not found
    if (linkData.domainId && !domainName) {
      throw createError({
        statusCode: 404,
        statusMessage: "Custom domain not found",
      });
    }

    // If link has custom domain, verify domain is active
    if (linkData.domainId && domainStatus !== "active") {
      throw createError({
        statusCode: 404,
        statusMessage: "Custom domain not verified or not found",
      });
    }

    // Set link to cache with domainName
    await setLink(shortCode, finalDomainName, linkData as Link);

    link = { ...linkData, domainName: finalDomainName };
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
  if (link.domainId && link.domainName !== host) {
    throw createError({
      statusCode: 404,
      statusMessage: "Domain does not match requested host",
    });
  }

  // Track click event in background (non-blocking)
  event.waitUntil(trackClickEvent(event, link));

  // Always redirect to the original URL
  return sendRedirect(event, link.originalUrl, 302);
});

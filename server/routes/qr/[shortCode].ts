import { db } from "~~/server/utils/database";
import { renderSVG } from "uqr";
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

    // Determine the correct domainName for caching
    let domainName = host; // Default to requested host

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

    // Set link to cache with domainName included
    await setLink(shortCode, domainName, dbLink);

    link = { ...dbLink, domainName };
  }

  // Use domainName from cache for QR code URL
  const protocol = getRequestProtocol(event);
  const shortUrl = `${protocol}://${link.domainName}/s/${shortCode}`;

  const qrSVG = renderSVG(shortUrl);

  setHeader(event, "Content-Type", "image/svg+xml");
  setHeader(event, "Cache-Control", "public, max-age=3600");

  return qrSVG;
});

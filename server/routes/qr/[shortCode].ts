import { db } from "~~/server/utils/database";
import { renderSVG } from "uqr";
import { getLink, setLink } from "~~/shared/utils/auth/link/cache";
import type { Link } from "~~/shared/types/link";

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
      .select("domain.domainName")
      .where("link.shortCode", "=", shortCode)
      .executeTakeFirst();

    if (!result) {
      throw createError({
        statusCode: 404,
        statusMessage: "Short link not found",
      });
    }

    // Extract domainName (use host if null) and link data
    const { domainName, ...linkData } = result;
    const finalDomainName = domainName ?? host;

    // If link has custom domain but domainName is null, domain not found
    if (linkData.domainId && !domainName) {
      throw createError({
        statusCode: 404,
        statusMessage: "Custom domain not found",
      });
    }

    // Set link to cache with domainName
    await setLink(shortCode, finalDomainName, linkData as Link);

    link = { ...linkData, domainName: finalDomainName };
  }

  // Use domainName from cache for QR code URL
  const protocol = getRequestProtocol(event);
  const shortUrl = `${protocol}://${link.domainName}/s/${shortCode}`;

  const qrSVG = renderSVG(shortUrl);

  setHeader(event, "Content-Type", "image/svg+xml");
  setHeader(event, "Cache-Control", "public, max-age=3600");

  return qrSVG;
});

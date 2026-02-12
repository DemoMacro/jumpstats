import { db } from "~~/server/utils/database";
import { renderSVG } from "uqr";

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
    .select("originalUrl")
    .where("shortCode", "=", shortCode)
    .executeTakeFirst();

  if (!link) {
    throw createError({
      statusCode: 404,
      statusMessage: "Short link not found",
    });
  }

  const protocol = getRequestProtocol(event);
  const host = getRequestHost(event);
  const shortUrl = `${protocol}://${host}/s/${shortCode}`;

  const qrSVG = renderSVG(shortUrl);

  setHeader(event, "Content-Type", "image/svg+xml");
  setHeader(event, "Cache-Control", "public, max-age=3600");

  return qrSVG;
});

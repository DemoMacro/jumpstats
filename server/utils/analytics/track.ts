import type { H3Event } from "h3";
import { getRequestIP, getHeader } from "h3";
import { UAParser } from "ua-parser-js";
import { isbot } from "isbot";
import { createGeoIPManager } from "geoip0";
import ipsbDriver from "geoip0/drivers/ipsb";
import { chdbClient } from "~~/server/utils/database";
import type { Link } from "~~/shared/types/link";
import type { GeoLocation } from "geoip0";

// GeoIP manager singleton
const geoip = createGeoIPManager({ driver: ipsbDriver() });

/**
 * Track a click event and store it in ClickHouse
 */
export async function trackClickEvent(event: H3Event, link: Link): Promise<void> {
  try {
    const ip = getRequestIP(event, { xForwardedFor: true }) ?? "";
    const userAgent = getHeader(event, "user-agent") ?? "";
    const referrer = getHeader(event, "referer") ?? "";

    // Parse User-Agent
    const ua = UAParser(userAgent);

    // Query GeoIP
    const geo: GeoLocation | null = await geoip.lookup(ip);

    // Extract query parameters
    const queryParams: Record<string, string> = {};
    let utmSource = "",
      utmMedium = "",
      utmCampaign = "",
      utmTerm = "",
      utmContent = "",
      utmId = "";

    try {
      const url = new URL(link.originalUrl);
      for (const [key, value] of url.searchParams) {
        switch (key.toLowerCase()) {
          case "utm_source":
            utmSource = value;
            break;
          case "utm_medium":
            utmMedium = value;
            break;
          case "utm_campaign":
            utmCampaign = value;
            break;
          case "utm_term":
            utmTerm = value;
            break;
          case "utm_content":
            utmContent = value;
            break;
          case "utm_id":
            utmId = value;
            break;
          default:
            queryParams[key] = value;
        }
      }
    } catch {
      // Invalid URL
    }

    // Insert into ClickHouse
    await chdbClient.insert({
      table: "clickEvents",
      values: [
        {
          id: crypto.randomUUID(),
          linkId: link.id,
          shortCode: link.shortCode,
          originalUrl: link.originalUrl,
          timestamp: new Date().toISOString().slice(0, 19).replace("T", " "),

          // Browser
          browserName: ua.browser.name ?? "",
          browserVersion: ua.browser.version ?? "",
          browserMajor: ua.browser.major ?? "",
          browserType: ua.browser.type ?? "",

          // Engine
          engineName: ua.engine.name ?? "",
          engineVersion: ua.engine.version ?? "",

          // OS
          osName: ua.os.name ?? "",
          osVersion: ua.os.version ?? "",

          // Device
          deviceType: ua.device.type ?? "",
          deviceVendor: ua.device.vendor ?? "",
          deviceModel: ua.device.model ?? "",

          // CPU
          cpuArchitecture: ua.cpu.architecture ?? "",

          // Bot
          isBot: isbot(userAgent) ? 1 : 0,

          // GeoIP
          ip,
          country: geo?.country ?? "",
          countryCode: geo?.countryCode ?? "",
          region: geo?.region ?? "",
          regionCode: geo?.regionCode ?? "",
          city: geo?.city ?? "",
          latitude: geo?.latitude ?? null,
          longitude: geo?.longitude ?? null,
          timezone: geo?.timezone ?? "",
          isp: geo?.isp ?? "",
          org: geo?.org ?? "",
          asn: geo?.asn ?? "",
          accuracyRadius: geo?.accuracyRadius ?? "",
          isProxy: geo?.isProxy ? 1 : 0,
          geoSource: geo?.source ?? "",

          // UTM
          utmSource,
          utmMedium,
          utmCampaign,
          utmTerm,
          utmContent,
          utmId,

          // Custom params
          queryParams,

          // Request
          referrer,
          userAgent,
        },
      ],
      format: "JSONEachRow",
    });
  } catch (error) {
    console.error("Failed to track click event:", error);
  }
}

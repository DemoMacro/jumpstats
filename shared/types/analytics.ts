import { z } from "zod";
import type { IResult } from "ua-parser-js";
import type { GeoLocation } from "geoip0";

// Re-export types for convenience
export type { IResult as IUAAResult, GeoLocation };

// ClickHouse schema for analytics
// Following best practices:
// - Use LowCardinality for strings with < 10k unique values (better compression)
// - Avoid Nullable for most fields (use empty string as default, better performance)
// - Only use Nullable where null has semantic meaning (latitude/longitude)
// - Use Map only for truly dynamic parameters
export type AnalyticsSchema = {
  clickEvents: {
    // Primary keys
    id: "String";
    linkId: "String";
    shortCode: "String";
    originalUrl: "String";
    timestamp: "DateTime";

    // Browser info - use LowCardinality for better compression
    browserName: "LowCardinality(String)";
    browserVersion: "LowCardinality(String)";
    browserMajor: "LowCardinality(String)";
    browserType: "LowCardinality(String)";

    // Engine info
    engineName: "LowCardinality(String)";
    engineVersion: "LowCardinality(String)";

    // OS info
    osName: "LowCardinality(String)";
    osVersion: "LowCardinality(String)";

    // Device info - deviceType uses Enum internally, but LowCardinality is simpler
    deviceType: "LowCardinality(String)";
    deviceVendor: "LowCardinality(String)";
    deviceModel: "LowCardinality(String)";

    // CPU info
    cpuArchitecture: "LowCardinality(String)";

    // Bot detection - UInt8 for boolean (0/1)
    isBot: "UInt8";

    // Geolocation info
    ip: "LowCardinality(String)";
    country: "LowCardinality(String)";
    countryCode: "LowCardinality(String)";
    region: "LowCardinality(String)";
    regionCode: "LowCardinality(String)";
    city: "LowCardinality(String)";
    timezone: "LowCardinality(String)";
    isp: "LowCardinality(String)";
    org: "LowCardinality(String)";
    asn: "LowCardinality(String)";
    accuracyRadius: "LowCardinality(String)";
    isProxy: "UInt8"; // UInt8 for boolean (0/1)
    geoSource: "LowCardinality(String)";

    // Standard UTM parameters - most queried fields
    utmSource: "LowCardinality(String)";
    utmMedium: "LowCardinality(String)";
    utmCampaign: "LowCardinality(String)";
    utmTerm: "LowCardinality(String)";
    utmContent: "LowCardinality(String)";
    utmId: "LowCardinality(String)";

    // Custom query parameters (Map for flexibility)
    // Stores all URL query parameters including:
    // - Custom UTM parameters (utm_custom1, utm_custom2, etc.)
    // - Marketing click IDs (fbclid, gclid, msclkid, etc.)
    // - User-defined tracking parameters
    queryParams: "Map(String, String)";

    // Request info
    referrer: "String"; // Full URL, may have high cardinality
  };
};

// Schema for a single click event (all required fields, no .optional())
export const ClickEventSchema = z.object({
  id: z.string(),
  linkId: z.string(),
  shortCode: z.string(),
  originalUrl: z.string(),
  timestamp: z.string(),

  // Browser info
  browserName: z.string(),
  browserType: z.string(),

  // OS info
  osName: z.string(),

  // Device info
  deviceType: z.string(),
  deviceVendor: z.string(),
  deviceModel: z.string(),

  // Bot detection
  isBot: z.number(),

  // Geolocation info
  country: z.string(),
  countryCode: z.string(),
  region: z.string(),
  regionCode: z.string(),
  city: z.string(),
  timezone: z.string(),
  isp: z.string(),
  org: z.string(),
  asn: z.string(),
  accuracyRadius: z.string(),
  isProxy: z.number(),
  geoSource: z.string(),

  // UTM parameters
  utmSource: z.string(),
  utmMedium: z.string(),
  utmCampaign: z.string(),
  utmTerm: z.string(),
  utmContent: z.string(),
  utmId: z.string(),

  // Custom query parameters
  queryParams: z.record(z.string(), z.string()),
});

export type ClickEvent = z.infer<typeof ClickEventSchema>;

import { chdbClient, chdbConfig } from "~~/server/utils/database";
import { getMigrations } from "better-auth/db/migration";
import { authConfig } from "~~/server/utils/auth";
import { db } from "~~/server/utils/database";
import { ClickHouseConfig, ClickHouseConnection, logger } from "@hypequery/clickhouse";

export default defineNitroPlugin(async () => {
  console.log("🚀 Initializing database connections...");

  // ==========================================
  // 1. Run Better Auth database migrations
  // ==========================================
  try {
    const { toBeCreated, toBeAdded, runMigrations } = await getMigrations(authConfig);

    // Check what migrations are needed
    if (toBeCreated.length > 0 || toBeAdded.length > 0) {
      console.log("📋 Better Auth Migrations Required:");
      console.log(
        "   Tables to create:",
        toBeCreated.map((t) => t.table),
      );
      console.log(
        "   Fields to add:",
        toBeAdded.map((t) => t.table),
      );

      // Run migrations
      await runMigrations();
      console.log("✅ Better Auth migrations completed successfully");
    } else {
      console.log("✅ Better Auth database schema is up to date");
    }

    // Optional: Log SQL for debugging
    // const sql = await compileMigrations();
    // console.log("Migration SQL:", sql);
  } catch (error) {
    console.error("❌ Failed to run Better Auth migrations:", error);
  }

  // ==========================================
  // 2. Add composite unique constraint for link table
  // ==========================================
  try {
    // Add composite unique constraint on domainId + shortCode
    await db.schema
      .alterTable("link")
      .addUniqueConstraint("link_domainId_shortCode_unique", ["domainId", "shortCode"])
      .execute();

    console.log("✅ Added composite unique constraint on (domainId, shortCode)");
  } catch (error) {
    // If constraint already exists, that's fine
    if (String(error).includes("already exists")) {
      console.log("✅ Composite unique constraint already exists");
    } else {
      console.error("❌ Failed to add composite unique constraint:", error);
    }
  }

  // ==========================================
  // 3. Initialize ClickHouse
  // ==========================================
  try {
    // Configure hypequery logger to only show warnings and errors
    logger.configure({
      level: "warn",
    });

    // Initialize with default database first, then create target database
    const defaultConfig: ClickHouseConfig = {
      ...chdbConfig,
      database: "default",
    };

    ClickHouseConnection.initialize(defaultConfig);
    const tempClient = ClickHouseConnection.getClient();

    // Create database if not exists
    await tempClient
      .command({
        query: `CREATE DATABASE IF NOT EXISTS ${chdbConfig.database}`,
      })
      .catch((err: unknown) => {
        console.error("Failed to create ClickHouse database:", err);
      });

    // Now initialize with the correct database
    ClickHouseConnection.initialize(chdbConfig);

    console.log("✅ ClickHouse connection initialized successfully");

    // Create database and table for analytics
    await chdbClient.command({
      query: `CREATE DATABASE IF NOT EXISTS jumpstats`,
    });

    // Create table
    await chdbClient.command({
      query: `
        CREATE TABLE IF NOT EXISTS jumpstats.clickEvents
        (
          -- Primary keys
          id String,
          linkId String,
          domainId String,
          shortCode String,
          originalUrl String,
          timestamp DateTime,

          -- Browser info
          browserName LowCardinality(String),
          browserVersion LowCardinality(String),
          browserMajor LowCardinality(String),
          browserType LowCardinality(String),

          -- Engine info
          engineName LowCardinality(String),
          engineVersion LowCardinality(String),

          -- OS info
          osName LowCardinality(String),
          osVersion LowCardinality(String),

          -- Device info
          deviceType LowCardinality(String),
          deviceVendor LowCardinality(String),
          deviceModel LowCardinality(String),

          -- CPU info
          cpuArchitecture LowCardinality(String),

          -- Bot detection
          isBot UInt8,

          -- Geolocation info
          ip LowCardinality(String),
          country LowCardinality(String),
          countryCode LowCardinality(String),
          region LowCardinality(String),
          regionCode LowCardinality(String),
          city LowCardinality(String),
          timezone LowCardinality(String),
          isp LowCardinality(String),
          org LowCardinality(String),
          asn LowCardinality(String),
          accuracyRadius LowCardinality(String),
          isProxy UInt8,
          geoSource LowCardinality(String),

          -- UTM parameters
          utmSource LowCardinality(String),
          utmMedium LowCardinality(String),
          utmCampaign LowCardinality(String),
          utmTerm LowCardinality(String),
          utmContent LowCardinality(String),
          utmId LowCardinality(String),

          -- Custom query parameters
          queryParams Map(String, String),

          -- Request info
          referrer String,

          -- Domain info
          domainName LowCardinality(String)
        )
        ENGINE = MergeTree()
        ORDER BY (linkId, toDate(timestamp), timestamp)
        PARTITION BY toMonth(timestamp)
        SETTINGS index_granularity = 8192
      `,
    });

    console.log("✅ ClickHouse analytics database and tables initialized successfully");
  } catch (error) {
    console.error("❌ Failed to initialize ClickHouse:", error);
  }

  console.log("✅ All database initialization completed");
});

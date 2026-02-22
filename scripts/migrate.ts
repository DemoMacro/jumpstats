import { chdbClient, chdbConfig } from "../server/utils/database";
import { getMigrations } from "better-auth/db/migration";
import { authConfig } from "../server/utils/auth";
import { db } from "../server/utils/database";
import { createClient } from "@clickhouse/client-web";
import { auth } from "../server/utils/auth";
import { env } from "std-env";

export async function migrate() {
  console.log("🚀 Running database migration...");

  // ==========================================
  // 1. Run Better Auth database migrations
  // ==========================================
  try {
    const { toBeCreated, toBeAdded, runMigrations } = await getMigrations(authConfig);

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

      await runMigrations();
      console.log("✅ Better Auth migrations completed successfully");
    } else {
      console.log("✅ Better Auth database schema is up to date");
    }
  } catch (error) {
    console.error("❌ Failed to run Better Auth migrations:", error);
    throw error;
  }

  // ==========================================
  // 2. Add composite unique constraint for link table
  // ==========================================
  try {
    await db.schema
      .alterTable("link")
      .addUniqueConstraint("link_domainId_shortCode_unique", ["domainId", "shortCode"])
      .execute();

    console.log("✅ Added composite unique constraint on (domainId, shortCode)");
  } catch (error) {
    if (String(error).includes("already exists")) {
      console.log("✅ Composite unique constraint already exists");
    } else {
      console.error("❌ Failed to add composite unique constraint:", error);
      throw error;
    }
  }

  // ==========================================
  // 3. Initialize ClickHouse
  // ==========================================
  try {
    const tempClient = createClient({
      url: chdbConfig.url,
      username: chdbConfig.username,
      password: chdbConfig.password,
      database: "default",
    });

    await tempClient.command({
      query: `CREATE DATABASE IF NOT EXISTS ${chdbConfig.database}`,
    });

    console.log("✅ ClickHouse connection initialized successfully");

    await chdbClient.command({
      query: `
        CREATE TABLE IF NOT EXISTS \`${chdbConfig.database}\`.clickEvents
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
    throw error;
  }

  // ==========================================
  // 4. Seed admin user
  // ==========================================
  const defaultAdminConfig = {
    email: env.ADMIN_EMAIL || "admin@js.gs",
    name: env.ADMIN_NAME || "System Administrator",
    username: env.ADMIN_USERNAME || "admin",
    password: env.ADMIN_PASSWORD || "admin123456",
  };

  try {
    console.log("🔐 Initializing admin user...");

    const result = await auth.api.createUser({
      body: {
        email: defaultAdminConfig.email,
        name: defaultAdminConfig.name,
        password: defaultAdminConfig.password,
        role: "admin",
        data: {
          username: defaultAdminConfig.username,
          displayUsername: defaultAdminConfig.username,
        },
      },
    });

    if (result?.user) {
      console.log("✅ Admin user initialized successfully");
      console.log(`   Email: ${defaultAdminConfig.email}`);
      console.log(`   Username: ${defaultAdminConfig.username}`);
    }
  } catch (error) {
    if (String(error).includes("User already exists")) {
      console.log("ℹ️ Admin user already exists, skipping initialization");
    } else {
      console.error("❌ Failed to initialize admin user:", error);
      throw error;
    }
  }

  console.log("✅ All database initialization completed");
}

// Execute migration when running script directly
if (import.meta.main) {
  await migrate();
}

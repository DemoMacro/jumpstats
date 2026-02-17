import { defineNuxtConfig } from "nuxt/config";

export default defineNuxtConfig({
  future: {
    compatibilityVersion: 5,
  },

  compatibilityDate: "2026-02-16",

  ssr: false,

  typescript: {
    typeCheck: true,
  },

  routeRules: {
    "/api/**": {
      cors: true,
    },
  },

  nitro: {
    future: {
      nativeSWR: true,
    },
    prerender: {
      routes: ["/", "/privacy", "/terms"],
    },
    rollupConfig: {
      external: ["pg-native", "cloudflare:sockets", "@react-email/render"],
    },
    cloudflare: {
      deployConfig: true,
      nodeCompat: true,
    },
  },

  modules: ["@nuxt/ui", "@vueuse/nuxt", "@nuxtjs/i18n", "@nuxt/content"],

  css: ["~/assets/css/main.css"],

  content: {
    experimental: { sqliteConnector: "native" },
  },

  i18n: {
    defaultLocale: "en",
    langDir: "locales",
    locales: [
      {
        code: "en",
        language: "en",
        file: "en.json",
        name: "English",
      },
      {
        code: "zh_cn",
        language: "zh_cn",
        file: "zh_cn.json",
        name: "简体中文",
      },
    ],
    detectBrowserLanguage: {
      cookieCrossOrigin: true,
    },
    strategy: "no_prefix",
    skipSettingLocaleOnNavigate: false,
    differentDomains: false,
  },

  hooks: {
    async "build:before"() {
      const { chdbClient, chdbConfig } = await import("./server/utils/database");
      const { getMigrations } = await import("better-auth/db/migration");
      const { authConfig: betterAuthConfig } = await import("./server/utils/auth");
      const { db } = await import("./server/utils/database");
      const { createClient } = await import("@clickhouse/client-web");
      const { logger } = await import("@hypequery/clickhouse");
      const { auth } = await import("./server/utils/auth");
      const { env } = await import("std-env");

      console.log("🚀 Running build-time database initialization...");

      // ==========================================
      // 1. Run Better Auth database migrations
      // ==========================================
      try {
        const { toBeCreated, toBeAdded, runMigrations } = await getMigrations(betterAuthConfig);

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
        logger.configure({
          level: "warn",
        });

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
          query: `CREATE DATABASE IF NOT EXISTS jumpstats`,
        });

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
    },
  },
});

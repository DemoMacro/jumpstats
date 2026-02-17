import { Pool } from "pg";
import { Kysely, PostgresDialect } from "kysely";
import { createClient } from "@clickhouse/client-web";
import { type ClickHouseConfig, createQueryBuilder, logger } from "@hypequery/clickhouse";
import type { Database } from "~~/shared/types/database";
import type { AnalyticsSchema } from "~~/shared/types/analytics";
import { env } from "std-env";

// Configure ClickHouse logger
logger.configure({
  level: "warn",
});

const pool = new Pool({
  connectionString: env.DATABASE_URL,
});

export const db = new Kysely<Database>({
  dialect: new PostgresDialect({ pool }),
});

export const chdbConfig: ClickHouseConfig = {
  url: env.CLICKHOUSE_URL!,
  database: env.CLICKHOUSE_DATABASE!,
  username: env.CLICKHOUSE_USERNAME!,
  password: env.CLICKHOUSE_PASSWORD!,
};

// ClickHouse client using @clickhouse/client-web
export const chdbClient = createClient({
  url: chdbConfig.url,
  username: chdbConfig.username,
  password: chdbConfig.password,
  database: chdbConfig.database,
});

// Create query builder with client instance for web/worker environment
// This allows @hypequery/clickhouse to work with @clickhouse/client-web
export const chdb = createQueryBuilder<AnalyticsSchema>({
  client: chdbClient,
});

import { Pool } from "pg";
import { Kysely, PostgresDialect } from "kysely";
import {
  type ClickHouseConfig,
  ClickHouseConnection,
  createQueryBuilder,
  logger,
} from "@hypequery/clickhouse";
import type { Database } from "~~/shared/types/database";
import type { AnalyticsSchema } from "~~/shared/types/analytics";
import { env } from "std-env";

const pool = new Pool({
  connectionString: env.DATABASE_URL,
});

export const db = new Kysely<Database>({
  dialect: new PostgresDialect({ pool }),
});

const chdbConfig: ClickHouseConfig = {
  url: env.CLICKHOUSE_URL!,
  database: env.CLICKHOUSE_DATABASE!,
  username: env.CLICKHOUSE_USERNAME!,
  password: env.CLICKHOUSE_PASSWORD!,
};

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
tempClient
  .command({
    query: `CREATE DATABASE IF NOT EXISTS ${env.CLICKHOUSE_DATABASE}`,
  })
  .catch((err: unknown) => {
    console.error("Failed to create ClickHouse database:", err);
  });

// Now initialize with the correct database
ClickHouseConnection.initialize(chdbConfig);
export const chdbClient = ClickHouseConnection.getClient();
export const chdb = createQueryBuilder<AnalyticsSchema>(chdbConfig);

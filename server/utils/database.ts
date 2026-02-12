import { Pool } from "pg";
import { Kysely, PostgresDialect } from "kysely";
import {
  type ClickHouseConfig,
  ClickHouseConnection,
  createQueryBuilder,
} from "@hypequery/clickhouse";
import type { Database } from "~~/shared/types/database";
import type { AnalyticsSchema } from "~~/shared/types/analytics";

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

export const db = new Kysely<Database>({
  dialect: new PostgresDialect({ pool }),
});

const chdbConfig: ClickHouseConfig = {
  url: process.env.CLICKHOUSE_URL!,
  database: process.env.CLICKHOUSE_DATABASE!,
  username: process.env.CLICKHOUSE_USERNAME!,
  password: process.env.CLICKHOUSE_PASSWORD!,
};

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
    query: `CREATE DATABASE IF NOT EXISTS ${process.env.CLICKHOUSE_DATABASE}`,
  })
  .catch((err: unknown) => {
    console.error("Failed to create ClickHouse database:", err);
  });

// Now initialize with the correct database
ClickHouseConnection.initialize(chdbConfig);
export const chdbClient = ClickHouseConnection.getClient();
export const chdb = createQueryBuilder<AnalyticsSchema>(chdbConfig);

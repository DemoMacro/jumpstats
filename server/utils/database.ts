import { Pool } from "pg";
import { Kysely, PostgresDialect } from "kysely";
import {
  type ClickHouseConfig,
  ClickHouseConnection,
  createQueryBuilder,
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

export const chdbConfig: ClickHouseConfig = {
  url: env.CLICKHOUSE_URL!,
  database: env.CLICKHOUSE_DATABASE!,
  username: env.CLICKHOUSE_USERNAME!,
  password: env.CLICKHOUSE_PASSWORD!,
};

// ClickHouse connection will be initialized in the plugin
// Lazy load the client - only get it when actually used
let chdbClientInstance: ReturnType<typeof ClickHouseConnection.getClient> | null = null;

export const getChdbClient = () => {
  if (!chdbClientInstance) {
    chdbClientInstance = ClickHouseConnection.getClient();
  }
  return chdbClientInstance;
};

// Export a convenient chdbClient that works like a regular client
// but lazily initializes on first access
export const chdbClient = new Proxy({} as ReturnType<typeof ClickHouseConnection.getClient>, {
  get(target, prop) {
    const client = getChdbClient();
    return client[prop as keyof typeof client];
  },
});

export const chdb = createQueryBuilder<AnalyticsSchema>(chdbConfig);

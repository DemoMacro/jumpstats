import { betterAuth, type BetterAuthOptions } from "better-auth";
import { username, admin, apiKey, organization, openAPI } from "better-auth/plugins";
import { Pool } from "pg";
import { link } from "../../../shared/utils/auth/link";
import { domain } from "../../../shared/utils/auth/domain";
import { env } from "std-env";

export const authConfig = {
  basePath: "/api",
  database: new Pool({
    // connection options
    connectionString: env.DATABASE_URL,
  }),
  advanced: {
    database: {
      generateId: "uuid",
    },
  },
  experimental: { joins: true },
  emailAndPassword: {
    enabled: true,
  },
  plugins: [username(), admin(), apiKey(), organization(), openAPI(), link(), domain()],
} satisfies BetterAuthOptions;

export const auth = betterAuth(authConfig);

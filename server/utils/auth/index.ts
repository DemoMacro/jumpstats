import { betterAuth } from "better-auth";
import { username, admin, apiKey, organization, openAPI } from "better-auth/plugins";
import { Pool } from "pg";
import { link } from "../../../shared/utils/auth/link";

export const auth = betterAuth({
  basePath: "/api",
  database: new Pool({
    // connection options
    connectionString: process.env.DATABASE_URL,
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
  plugins: [username(), admin(), apiKey(), organization(), openAPI(), link()],
});

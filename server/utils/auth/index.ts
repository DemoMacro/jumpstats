import { betterAuth, type BetterAuthOptions } from "better-auth";
import { username, admin, apiKey, organization, openAPI } from "better-auth/plugins";
import { Pool } from "pg";
import { link } from "../../../shared/utils/auth/link";
import { domain } from "../../../shared/utils/auth/domain";
import { env } from "std-env";
import { sendEmailVerification } from "../email/resend";

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
    requireEmailVerification: true,
  },
  emailVerification: {
    sendVerificationEmail: async ({ user, url }) => {
      // Use void to avoid blocking - recommended by better-auth to prevent timing attacks
      void sendEmailVerification({
        user,
        url,
      });
    },
    sendOnSignUp: true,
    sendOnSignIn: true,
    autoSignInAfterVerification: true,
    expiresIn: 3600, // 1 hour
  },
  plugins: [
    username(),
    admin(),
    apiKey({ enableSessionForAPIKeys: true }),
    organization(),
    openAPI(),
    domain(),
    link(),
  ],
  user: {
    deleteUser: {
      enabled: true,
    },
    changeEmail: {
      enabled: true,
    },
  },
} satisfies BetterAuthOptions;

export const auth = betterAuth(authConfig);

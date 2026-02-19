import { betterAuth, type BetterAuthOptions } from "better-auth";
import { username, admin, apiKey, organization, openAPI } from "better-auth/plugins";
import { Pool } from "pg";
import { link } from "../../../shared/utils/auth/link";
import { domain } from "../../../shared/utils/auth/domain";
import { env } from "std-env";
import { sendEmailVerification } from "../email/resend";
import { cacheStorage } from "../../../shared/utils/storage";
import { toNumber, isValidIP } from "ipdo";
import reservedUsernames from "reserved-usernames";

/**
 * Normalize better-auth secondary storage keys for unstorage compatibility
 *
 * Better-auth uses format: {ip}|{path}
 * For example: 0000:0000:0000:0000:0000:0000:0000:0000|/sign-in/username
 *
 * This function converts IPv6 addresses to compressed format (e.g., ::1 instead of full zeros),
 * converts IPv4 addresses to integer for shorter keys, and replaces | with : and / with -
 * for filesystem compatibility.
 */
function normalizeKey(key: string): string {
  const parts = key.split("|");
  if (parts.length !== 2) return key;

  const [ipPart, pathPart] = parts;
  if (!ipPart || !pathPart) return key;

  // Normalize IP address
  let normalizedIP: string;
  if (!isValidIP(ipPart)) {
    // Not a valid IP, use as-is
    normalizedIP = ipPart;
  } else {
    // Convert IP to number for shorter keys (works for both IPv4 and IPv6)
    const num = toNumber(ipPart);
    normalizedIP = num.toString();
  }

  // Replace unsupported characters
  // | (pipe) -> : (colon)
  // / (slash) -> - (dash)
  return `${normalizedIP}:${pathPart.replace(/\//g, "-")}`;
}

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
  secondaryStorage: {
    get: async (key: string) => {
      const normalizedKey = normalizeKey(key);
      return await cacheStorage.getItem(normalizedKey);
    },
    set: async (key: string, value: string, ttl?: number) => {
      const normalizedKey = normalizeKey(key);
      if (ttl) {
        await cacheStorage.setItem(normalizedKey, value, { ttl: Math.floor(ttl) });
      } else {
        await cacheStorage.setItem(normalizedKey, value);
      }
    },
    delete: async (key: string) => {
      const normalizedKey = normalizeKey(key);
      await cacheStorage.removeItem(normalizedKey);
    },
  },
  plugins: [
    username({
      minUsernameLength: 5, // Must be more than 4 characters
      maxUsernameLength: 30,
      usernameValidator: (username) => {
        const lowerUsername = username.toLowerCase();

        // Allow admin username specified in environment variable
        if (env.ADMIN_USERNAME && lowerUsername === env.ADMIN_USERNAME.toLowerCase()) {
          return true;
        }

        // Check against reserved usernames list
        if (reservedUsernames.indexOf(lowerUsername) !== -1) {
          return false;
        }

        // Character set validation: only letters, numbers, underscores, and hyphens
        return /^[a-zA-Z0-9_-]+$/.test(username);
      },
      displayUsernameValidator: (displayUsername) => {
        // Display name uses the same character set restrictions
        return /^[a-zA-Z0-9_-]+$/.test(displayUsername);
      },
    }),
    admin(),
    apiKey({
      enableSessionForAPIKeys: true,
      storage: "secondary-storage",
      fallbackToDatabase: true,
    }),
    organization(),
    openAPI(),
    domain(),
    link(),
  ],
  rateLimit: {
    enabled: true,
    window: 60,
    max: 100,
    storage: "secondary-storage",
  },
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

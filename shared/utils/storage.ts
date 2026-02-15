import { createStorage } from "unstorage";
import redisDriver from "unstorage/drivers/redis";
import memoryDriver from "unstorage/drivers/memory";
import fsDriver from "unstorage/drivers/fs";
import { isDevelopment, env } from "std-env";

/**
 * Create storage instances with static drivers
 * - Development: Uses filesystem driver with ./.nitro/cache
 * - Production: Uses Redis if REDIS_URL is configured
 * - Fallback: Uses memory otherwise
 */

// Cache storage: Filesystem (dev) / Redis (prod) / Memory (fallback)
export const cacheStorage = createStorage({
  driver: isDevelopment
    ? fsDriver({
        base: "./.nitro/cache",
      })
    : env.REDIS_URL
      ? redisDriver({
          url: env.REDIS_URL,
        })
      : memoryDriver(),
});

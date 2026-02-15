import type { Link } from "../../../types/link";
import { cacheStorage } from "../../storage";

// Type for cached link data with domainName included
export type CachedLink = Link & { domainName: string };

/**
 * Get link from cache
 * - Returns cached data if exists (even if expired - let TTL auto-refresh)
 * - Returns null if cache miss - caller handles DB query
 *
 * @param shortCode - The short code
 * @param domainName - Domain name (default or custom)
 */
export async function getLink(shortCode: string, domainName: string): Promise<CachedLink | null> {
  const cacheKey = `link:${domainName}:${shortCode}`;

  const cached = await cacheStorage.getItem<CachedLink>(cacheKey);

  if (cached) {
    return cached;
  }

  return null;
}

/**
 * Set link to cache with auto-expiry
 * Calculates TTL based on link.expiresAt
 * Only caches if TTL > 0
 *
 * @param shortCode - The short code
 * @param domainName - Domain name
 * @param link - Link object to cache
 */
export async function setLink(shortCode: string, domainName: string, link: Link): Promise<void> {
  const cacheKey = `link:${domainName}:${shortCode}`;

  // Calculate TTL based on link.expiresAt
  let ttl = 3600; // Default 1 hour

  if (link.expiresAt) {
    const expiresInSeconds = Math.floor((link.expiresAt.getTime() - Date.now()) / 1000);

    if (expiresInSeconds > 0 && expiresInSeconds < ttl) {
      ttl = expiresInSeconds;
    }
  }

  // Only cache if TTL > 0 (Nitro handles auto-expiry)
  if (ttl > 0) {
    // Include domainName in cached data for easy access
    const cachedLink: CachedLink = {
      ...link,
      domainName,
    };
    await cacheStorage.setItem(cacheKey, cachedLink, { ttl });
  }
}

/**
 * Remove link from cache
 * Call when link is deleted
 *
 * @param shortCode - The short code
 * @param domainName - Domain name
 */
export async function removeLink(shortCode: string, domainName: string): Promise<void> {
  const cacheKey = `link:${domainName}:${shortCode}`;
  await cacheStorage.removeItem(cacheKey);
}

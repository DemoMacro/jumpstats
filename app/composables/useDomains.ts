import { authClient } from "~/utils/auth";
import type { DomainStatus } from "~~/shared/types/domain";

export interface DomainOption {
  label: string;
  value: string;
}

export function useDomains(
  query?: {
    status?: DomainStatus;
    organizationId?: string;
    limit?: number;
    offset?: number;
  },
  watchSources?: any[],
) {
  // Generate cache key based on query parameters
  const cacheKey = computed(() => {
    const parts = ["domains"];
    if (query?.status) parts.push(query.status);
    if (query?.organizationId) parts.push(query.organizationId);
    if (query?.limit) parts.push(query.limit.toString());
    if (query?.offset) parts.push(query.offset.toString());
    return parts.join("-");
  });

  // Fetch domains using useAsyncData for SSR optimization
  const {
    data: domainsData,
    pending: loading,
    refresh: fetchDomains,
    error,
  } = useAsyncData(
    cacheKey.value,
    async () => {
      const result = await authClient.domain.list({
        query: query || {
          status: "active",
          limit: 100,
          offset: 0,
        },
      });

      if (result.error) {
        throw new Error(result.error.message || "Failed to fetch domains");
      }

      return result.data;
    },
    {
      transform: (data) => ({
        domains: data?.domains ?? [],
        total: data?.total ?? 0,
      }),
      watch: watchSources,
    },
  );

  const domains = computed(() => domainsData.value?.domains ?? []);
  const total = computed(() => domainsData.value?.total ?? 0);

  // Convert domains to select options format
  const domainOptions = computed<DomainOption[]>(() => {
    // Add default option (no custom domain)
    const options: DomainOption[] = [
      {
        label: "Default",
        value: "default",
      },
    ];

    // Add custom domains (only active domains for options)
    domains.value
      .filter((d) => d.status === "active")
      .forEach((domain) => {
        options.push({
          label: domain.domainName,
          value: domain.id,
        });
      });

    return options;
  });

  return {
    domains,
    total,
    loading,
    domainOptions,
    refresh: fetchDomains,
    error,
  };
}

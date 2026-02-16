import { authClient } from "~/utils/auth";

export interface DomainOption {
  label: string;
  value: string;
}

export function useDomains() {
  // Fetch domains using useAsyncData for SSR optimization
  const {
    data: domainsData,
    pending: loading,
    refresh: fetchDomains,
  } = useAsyncData("domains", async () => {
    const result = await authClient.domain.list({
      query: {
        status: "active",
        limit: 100,
        offset: 0,
      },
    });

    if (result.error) {
      throw new Error(result.error.message || "Failed to fetch domains");
    }

    return result.data.domains || [];
  });

  const domains = computed(() => domainsData.value ?? []);

  // Convert domains to select options format
  const domainOptions = computed<DomainOption[]>(() => {
    // Add default option (no custom domain)
    const options: DomainOption[] = [
      {
        label: "Default",
        value: "default",
      },
    ];

    // Add custom domains
    domains.value.forEach((domain) => {
      options.push({
        label: domain.domainName,
        value: domain.id,
      });
    });

    return options;
  });

  return {
    domains,
    loading,
    domainOptions,
    refresh: fetchDomains,
  };
}

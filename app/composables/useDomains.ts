import type { Domain } from "~~/shared/types/domain";
import { authClient } from "~/utils/auth";

export interface DomainOption {
  label: string;
  value: string;
}

export function useDomains() {
  const domains = ref<Domain[]>([]);
  const loading = ref(false);
  const error = ref<string | null>(null);

  async function fetchDomains() {
    loading.value = true;
    error.value = null;
    try {
      const result = await authClient.domain.list({
        query: {
          status: "active",
          limit: 100,
          offset: 0,
        },
      });

      if (result.error) {
        error.value = result.error.message || "Failed to fetch domains";
        return;
      }

      domains.value = result.data.domains || [];
    } catch (e) {
      error.value = e instanceof Error ? e.message : "An unexpected error occurred";
    } finally {
      loading.value = false;
    }
  }

  // Convert domains to select options format
  const domainOptions = computed<DomainOption[]>(() => {
    return domains.value.map((domain) => ({
      label: domain.domainName,
      value: domain.id,
    }));
  });

  // Auto-fetch on mount
  onMounted(() => {
    void fetchDomains();
  });

  return {
    domains,
    loading,
    error,
    domainOptions,
    refresh: fetchDomains,
  };
}

import type { Link } from "~~/shared/types/link";
import { authClient } from "~/utils/auth";

export function useLinkDetail(linkId: string) {
  const link = ref<Link | null>(null);
  const loading = ref(false);
  const error = ref<string | null>(null);

  async function fetchLink() {
    loading.value = true;
    error.value = null;
    try {
      const result = await authClient.link.get({
        query: {
          linkId,
        },
      });

      if (result.error) {
        error.value = result.error.message || "Failed to fetch link";
        return;
      }

      link.value = result.data;
    } catch (e) {
      error.value = e instanceof Error ? e.message : "An unexpected error occurred";
    } finally {
      loading.value = false;
    }
  }

  // Auto-fetch on mount
  void fetchLink();

  return {
    link,
    loading,
    error,
    fetchLink,
  };
}

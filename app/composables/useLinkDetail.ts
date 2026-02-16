import { authClient } from "~/utils/auth";

export function useLinkDetail(linkId: string) {
  // Fetch link using useAsyncData for SSR optimization
  const {
    data: link,
    pending: loading,
    refresh: fetchLink,
  } = useAsyncData(`link-${linkId}`, async () => {
    const result = await authClient.link.get({
      query: {
        linkId,
      },
    });

    if (result.error) {
      throw new Error(result.error.message || "Failed to fetch link");
    }

    return result.data;
  });

  return {
    link,
    loading,
    fetchLink,
  };
}

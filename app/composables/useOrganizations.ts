import type { Organization } from "better-auth/plugins";
import { authClient } from "~/utils/auth";

// Extended type for organization creation
interface OrganizationCreateData {
  name: string;
  slug: string;
  logo?: string;
  metadata?: Record<string, any>;
  userId?: string; // For admin creation
  keepCurrentActiveOrganization?: boolean;
}

export const useOrganizations = (options?: {
  limit?: number;
  offset?: number;
  searchValue?: string;
}) => {
  // Fetch organizations using useAsyncData for SSR optimization
  const {
    data: orgsData,
    pending: loading,
    refresh: fetchOrganizations,
  } = useAsyncData(
    "admin-organizations",
    async () => {
      const result = await authClient.organization.list({
        query: {
          limit: options?.limit || 100,
          offset: options?.offset || 0,
          searchValue: options?.searchValue,
          sortBy: "name",
        },
      });
      return result.data;
    },
    {
      transform: (data) => ({
        organizations: data ?? [],
        total: data?.length ?? 0,
      }),
    },
  );

  const organizations = computed(() => orgsData.value?.organizations ?? []);
  const total = computed(() => orgsData.value?.total ?? 0);

  const createOrganization = async (data: OrganizationCreateData) => {
    const result = await authClient.organization.create(data);

    if (result.error) {
      throw new Error(result.error.message || "Failed to create organization");
    }

    // Refresh organizations list
    await fetchOrganizations();
    return result;
  };

  const deleteOrganization = async (organizationId: string) => {
    const result = await authClient.organization.delete({
      organizationId,
    });

    if (result.error) {
      throw new Error(result.error.message || "Failed to delete organization");
    }

    // Refresh to get updated list
    await fetchOrganizations();
  };

  const getOrganizationById = (organizationId: string): Organization | null => {
    return organizations.value.find((org) => org.id === organizationId) || null;
  };

  // Computed property for search/filter functionality
  const filteredOrganizations = computed(() => {
    if (!organizations.value.length) return [];
    return organizations.value;
  });

  return {
    organizations,
    filteredOrganizations,
    loading,
    total,
    fetchOrganizations,
    createOrganization,
    deleteOrganization,
    getOrganizationById,
  };
};

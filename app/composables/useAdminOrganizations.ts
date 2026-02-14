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

export const useAdminOrganizations = () => {
  const organizations = useState<Organization[]>("admin-organizations", () => []);
  const loading = ref(false);
  const error = ref<string | null>(null);
  const total = ref(0);

  const fetchOrganizations = async () => {
    loading.value = true;
    error.value = null;

    try {
      // Better-Auth doesn't have a direct admin list organizations endpoint
      // We'll use the regular list method which returns orgs for the current user
      // For admin purposes, you might need to implement a custom server endpoint
      const result = await authClient.organization.list();

      if (result.data) {
        organizations.value = result.data;
        total.value = result.data.length;
      }
    } catch (err) {
      error.value = err instanceof Error ? err.message : "Failed to fetch organizations";
      organizations.value = [];
    } finally {
      loading.value = false;
    }
  };

  const createOrganization = async (data: OrganizationCreateData) => {
    try {
      const result = await authClient.organization.create(data);

      if (result.error) {
        throw new Error(result.error.message || "Failed to create organization");
      }

      // Refresh organizations list
      await fetchOrganizations();
      return result;
    } catch (err) {
      error.value = err instanceof Error ? err.message : "Failed to create organization";
      throw err;
    }
  };

  const deleteOrganization = async (organizationId: string) => {
    try {
      const result = await authClient.organization.delete({
        organizationId,
      });

      if (result.error) {
        throw new Error(result.error.message || "Failed to delete organization");
      }

      // Remove from local state immediately
      organizations.value = organizations.value.filter((org) => org.id !== organizationId);
      total.value = organizations.value.length;
    } catch (err) {
      error.value = err instanceof Error ? err.message : "Failed to delete organization";
      throw err;
    }
  };

  const getOrganizationById = (organizationId: string): Organization | null => {
    return organizations.value.find((org) => org.id === organizationId) || null;
  };

  // Computed property for search/filter functionality
  const filteredOrganizations = computed(() => {
    if (!organizations.value.length) return [];

    // If you need server-side filtering, implement it in fetchOrganizations
    return organizations.value;
  });

  return {
    organizations: readonly(organizations),
    filteredOrganizations,
    loading: readonly(loading),
    error: readonly(error),
    total: readonly(total),
    fetchOrganizations,
    createOrganization,
    deleteOrganization,
    getOrganizationById,
  };
};

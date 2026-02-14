import type { Organization } from "better-auth/plugins";
import { authClient } from "~/utils/auth";

// Extended type for organization updates including additional operations
interface OrganizationUpdateData extends Partial<Organization> {
  newLogo?: string;
  newMetadata?: Record<string, any>;
}

export const useAdminOrg = (orgId: string) => {
  const organization = useState<Organization | null>(`admin-org-${orgId}`, () => null);
  const loading = ref(false);
  const error = ref<string | null>(null);

  const fetchOrg = async () => {
    if (organization.value && !error.value) return;

    loading.value = true;
    error.value = null;

    try {
      const result = await authClient.organization.getFullOrganization({
        query: { organizationId: orgId },
      });

      if (result.data) {
        organization.value = result.data;
      } else {
        throw new Error("Organization not found");
      }
    } catch (err) {
      error.value = err instanceof Error ? err.message : "Failed to fetch organization";
      organization.value = null;
    } finally {
      loading.value = false;
    }
  };

  const updateOrg = async (updates: OrganizationUpdateData) => {
    if (!organization.value) return;

    // Build update data with proper field mapping
    const updateData = {
      name: updates.name,
      slug: updates.slug,
      logo: updates.logo || updates.newLogo || undefined,
      metadata: updates.metadata || updates.newMetadata || undefined,
    };

    // Remove undefined values
    Object.keys(updateData).forEach((key) => {
      if (updateData[key as keyof typeof updateData] === undefined) {
        delete updateData[key as keyof typeof updateData];
      }
    });

    // Use Better-Auth organization update API
    const result = await authClient.organization.update({
      organizationId: organization.value.id,
      data: updateData,
    });

    if (result.error) {
      throw new Error(result.error.message || "Failed to update organization");
    }

    // Immediate local state update
    if (organization.value) {
      Object.assign(organization.value, updateData);
    }
  };

  // Delete organization
  const deleteOrg = async () => {
    if (!organization.value) return;

    const result = await authClient.organization.delete({
      organizationId: organization.value.id,
    });

    if (result.error) {
      throw new Error(result.error.message || "Failed to delete organization");
    }

    // Clear local state
    organization.value = null;
  };

  // Set as active organization
  const setActiveOrg = async () => {
    if (!organization.value) return;

    const result = await authClient.organization.setActive({
      organizationId: organization.value.id,
    });

    if (result.error) {
      throw new Error(result.error.message || "Failed to set active organization");
    }
  };

  return {
    organization: readonly(organization),
    loading: readonly(loading),
    error: readonly(error),
    fetchOrg,
    updateOrg,
    deleteOrg,
    setActiveOrg,
  };
};

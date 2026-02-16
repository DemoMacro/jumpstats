import type { Organization } from "better-auth/plugins";
import { authClient } from "~/utils/auth";

// Extended type for organization updates including additional operations
interface OrganizationUpdateData extends Partial<Organization> {
  newLogo?: string;
  newMetadata?: Record<string, any>;
}

export const useAdminOrg = (orgId: string) => {
  // Fetch organization using useAsyncData for SSR optimization
  const {
    data: organization,
    pending: loading,
    refresh: fetchOrg,
  } = useAsyncData(`admin-org-${orgId}`, async () => {
    const result = await authClient.organization.getFullOrganization({
      query: { organizationId: orgId },
    });
    return result.data;
  });

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

    // Refresh data from server
    await fetchOrg();
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
    organization,
    loading,
    fetchOrg,
    updateOrg,
    deleteOrg,
    setActiveOrg,
  };
};

import type { Member } from "better-auth/plugins";

export const useOrgMembers = (orgId: string) => {
  const members = ref<Member[]>([]);
  const loading = ref(false);
  const error = ref<string | null>(null);

  const fetchMembers = async () => {
    loading.value = true;
    error.value = null;

    try {
      const { $authClient } = useNuxtApp();
      const result = await $authClient.organization.listMembers({
        query: {
          organizationId: orgId,
          limit: 1000, // Get all members for admin view
        },
      });

      if (result.data) {
        members.value = result.data.members;
      }
    } catch (err) {
      error.value = err instanceof Error ? err.message : "Failed to fetch members";
      members.value = [];
    } finally {
      loading.value = false;
    }
  };

  const inviteMember = async (
    email: string,
    role: "owner" | "admin" | "member",
    resend: boolean = true,
  ) => {
    try {
      const { $authClient } = useNuxtApp();
      const result = await $authClient.organization.inviteMember({
        email,
        role,
        organizationId: orgId,
        resend,
      });

      if (result.error) {
        throw new Error(result.error.message || "Failed to invite member");
      }

      // Refresh members list to get updated data
      await fetchMembers();
      return result;
    } catch (err) {
      error.value = err instanceof Error ? err.message : "Failed to invite member";
      throw err;
    }
  };

  // Note: Member role update would require custom server implementation
  // as Better-Auth doesn't provide direct role update API

  const removeMember = async (memberId: string) => {
    try {
      const { $authClient } = useNuxtApp();
      const result = await $authClient.organization.removeMember({
        memberIdOrEmail: memberId,
        organizationId: orgId,
      });

      if (result.error) {
        throw new Error(result.error.message || "Failed to remove member");
      }

      // Remove from local state immediately
      members.value = members.value.filter((m) => m.id !== memberId);
    } catch (err) {
      error.value = err instanceof Error ? err.message : "Failed to remove member";
      throw err;
    }
  };

  const leaveOrganization = async () => {
    try {
      const { $authClient } = useNuxtApp();
      const result = await $authClient.organization.leave({
        organizationId: orgId,
      });

      if (result.error) {
        throw new Error(result.error.message || "Failed to leave organization");
      }

      // This would typically trigger a navigation or state change
      // as the user is no longer a member of this organization
    } catch (err) {
      error.value = err instanceof Error ? err.message : "Failed to leave organization";
      throw err;
    }
  };

  return {
    members: readonly(members),
    loading: readonly(loading),
    error: readonly(error),
    fetchMembers,
    inviteMember,
    removeMember,
    leaveOrganization,
  };
};

import type { Member } from "better-auth/plugins";
import { authClient } from "~/utils/auth";

export const useOrgMembers = (orgId: string) => {
  // Fetch members using useAsyncData for SSR optimization
  const {
    data: membersData,
    pending: loading,
    refresh: fetchMembers,
  } = useAsyncData(
    `org-members-${orgId}`,
    async () => {
      const result = await authClient.organization.listMembers({
        query: {
          organizationId: orgId,
          limit: 1000, // Get all members for admin view
        },
      });
      return result.data;
    },
    {
      transform: (data) => data?.members ?? [],
    },
  );

  const members = computed(() => membersData.value ?? []);

  const inviteMember = async (
    email: string,
    role: "owner" | "admin" | "member",
    resend: boolean = true,
  ) => {
    try {
      const result = await authClient.organization.inviteMember({
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
      throw err;
    }
  };

  const removeMember = async (memberId: string) => {
    try {
      const result = await authClient.organization.removeMember({
        memberIdOrEmail: memberId,
        organizationId: orgId,
      });

      if (result.error) {
        throw new Error(result.error.message || "Failed to remove member");
      }

      // Refresh members list to get updated data
      await fetchMembers();
    } catch (err) {
      throw err;
    }
  };

  const leaveOrganization = async () => {
    try {
      const result = await authClient.organization.leave({
        organizationId: orgId,
      });

      if (result.error) {
        throw new Error(result.error.message || "Failed to leave organization");
      }

      // This would typically trigger a navigation or state change
      // as the user is no longer a member of this organization
    } catch (err) {
      throw err;
    }
  };

  return {
    members,
    loading,
    fetchMembers,
    inviteMember,
    removeMember,
    leaveOrganization,
  };
};

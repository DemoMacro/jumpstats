export const useAdminStats = () => {
  const totalUsers = ref(0);
  const totalOrgs = ref(0);
  const adminUsers = ref(0);
  const activeSessions = ref(0);
  const loading = ref(false);
  const error = ref<string | null>(null);

  const fetchStats = async () => {
    loading.value = true;
    error.value = null;

    try {
      const { $authClient } = useNuxtApp();

      // Fetch all users
      const usersResult = await $authClient.admin.listUsers({
        query: { limit: 10000 },
      });

      if (usersResult.data?.users) {
        totalUsers.value = usersResult.data.users.length;
        adminUsers.value = usersResult.data.users.filter((user) => user.role === "admin").length;
      }

      // Fetch all organizations
      const orgsResult = await $authClient.organization.list();

      if (orgsResult.data) {
        totalOrgs.value = orgsResult.data.length;
      }

      // For active sessions, we'll need to check sessions for all users
      // This is more expensive, so we'll limit to a reasonable number for now
      let sessionCount = 0;
      const userSubset = usersResult.data?.users.slice(0, 20) || [];

      for (const user of userSubset) {
        try {
          const sessionsResult = await $authClient.admin.listUserSessions({
            userId: user.id,
          });
          if (sessionsResult.data?.sessions) {
            sessionCount += sessionsResult.data.sessions.filter(
              (session) => new Date(session.expiresAt) > new Date(),
            ).length;
          }
        } catch {
          // Skip if we can't get sessions for a user
          continue;
        }
      }

      // If we have many users, estimate total sessions based on the sample
      if (usersResult.data?.users && usersResult.data.users.length > 20) {
        const avgSessionsPerUser = sessionCount / Math.min(userSubset.length, 1);
        activeSessions.value = Math.round(avgSessionsPerUser * usersResult.data.users.length);
      } else {
        activeSessions.value = sessionCount;
      }
    } catch (err) {
      error.value = err instanceof Error ? err.message : "Failed to fetch admin stats";
    } finally {
      loading.value = false;
    }
  };

  return {
    totalUsers: readonly(totalUsers),
    totalOrgs: readonly(totalOrgs),
    adminUsers: readonly(adminUsers),
    activeSessions: readonly(activeSessions),
    loading: readonly(loading),
    error: readonly(error),
    fetchStats,
  };
};

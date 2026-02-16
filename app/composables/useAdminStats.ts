import { authClient } from "~/utils/auth";

export const useAdminStats = () => {
  // Fetch stats using useAsyncData for SSR optimization
  const {
    data: statsData,
    pending: loading,
    refresh: fetchStats,
  } = useAsyncData("admin-stats", async () => {
    // Fetch all users
    const usersResult = await authClient.admin.listUsers({
      query: { limit: 10000 },
    });

    const totalUsers = usersResult.data?.users?.length || 0;
    const adminUsers = usersResult.data?.users.filter((user) => user.role === "admin").length || 0;

    // Fetch all organizations
    const orgsResult = await authClient.organization.list();
    const totalOrgs = orgsResult.data?.length || 0;

    // For active sessions, we'll need to check sessions for all users
    // This is more expensive, so we'll limit to a reasonable number for now
    let sessionCount = 0;
    const userSubset = usersResult.data?.users.slice(0, 20) || [];

    for (const user of userSubset) {
      try {
        const sessionsResult = await authClient.admin.listUserSessions({
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
    let activeSessions: number;
    if (usersResult.data?.users && usersResult.data.users.length > 20) {
      const avgSessionsPerUser = sessionCount / Math.min(userSubset.length, 1);
      activeSessions = Math.round(avgSessionsPerUser * usersResult.data.users.length);
    } else {
      activeSessions = sessionCount;
    }

    return {
      totalUsers,
      totalOrgs,
      adminUsers,
      activeSessions,
    };
  });

  const totalUsers = computed(() => statsData.value?.totalUsers ?? 0);
  const totalOrgs = computed(() => statsData.value?.totalOrgs ?? 0);
  const adminUsers = computed(() => statsData.value?.adminUsers ?? 0);
  const activeSessions = computed(() => statsData.value?.activeSessions ?? 0);

  return {
    totalUsers,
    totalOrgs,
    adminUsers,
    activeSessions,
    loading,
    fetchStats,
  };
};

import { authClient } from "~/utils/auth";

export const useSessions = (searchValue?: Ref<string>) => {
  // Fetch sessions using useAsyncData for SSR optimization
  const {
    data: sessionsData,
    pending: loading,
    refresh: fetchSessions,
  } = useAsyncData(
    computed(() => `admin-sessions-${searchValue?.value || "all"}`),
    async () => {
      // First get all users
      const usersResult = await authClient.admin.listUsers({
        query: {
          limit: 1000,
          searchValue: searchValue?.value,
        },
      });

      if (!usersResult.data?.users) {
        return [];
      }

      const allSessions = [];

      // Fetch sessions for each user
      for (const user of usersResult.data.users) {
        try {
          const sessionsResult = await authClient.admin.listUserSessions({
            userId: user.id,
          });

          if (sessionsResult.data?.sessions) {
            const userSessions = sessionsResult.data.sessions.map((session) => ({
              ...session,
              userEmail: user.email,
              userName: user.name,
              role: user.role || "user",
            }));

            allSessions.push(...userSessions);
          }
        } catch {
          // Skip if we can't get sessions for a user
          continue;
        }
      }

      return allSessions;
    },
  );

  const sessions = computed(() => sessionsData.value ?? []);

  const revokeUserSessions = async (userId: string) => {
    const result = await authClient.admin.revokeUserSessions({
      userId,
    });

    if (result.error) {
      throw new Error(result.error.message || "Failed to revoke sessions");
    }

    // Refresh to get updated sessions
    await fetchSessions();

    return true;
  };

  return {
    sessions,
    loading,
    fetchSessions,
    revokeUserSessions,
  };
};

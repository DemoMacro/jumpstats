import type { Session } from "better-auth";
import { authClient } from "~/utils/auth";

interface SessionWithUserInfo extends Session {
  userEmail: string;
  userName?: string;
  role: string;
}

export const useAdminSessions = () => {
  const sessions = ref<SessionWithUserInfo[]>([]);
  const loading = ref(false);
  const error = ref<string | null>(null);

  const fetchSessions = async (searchValue?: string) => {
    loading.value = true;
    error.value = null;

    try {
      // First get all users
      const usersResult = await authClient.admin.listUsers({
        query: {
          limit: 1000,
          searchValue,
        },
      });

      if (!usersResult.data?.users) {
        sessions.value = [];
        return;
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

      sessions.value = allSessions;
    } catch (err) {
      error.value = err instanceof Error ? err.message : "Failed to fetch sessions";
      sessions.value = [];
    } finally {
      loading.value = false;
    }
  };

  const revokeUserSessions = async (userId: string) => {
    const result = await authClient.admin.revokeUserSessions({
      userId,
    });

    if (result.error) {
      throw new Error(result.error.message || "Failed to revoke sessions");
    }

    // Remove user's sessions from local state
    sessions.value = sessions.value.filter((s) => s.userId !== userId);

    return true;
  };

  // Create mutable copy for table
  const mutableSessions = ref<SessionWithUserInfo[]>([]);

  // Update mutable sessions when readonly sessions change
  watch(sessions, (newSessions) => {
    mutableSessions.value = [...newSessions];
  });

  return {
    sessions: mutableSessions,
    loading: readonly(loading),
    error: readonly(error),
    fetchSessions,
    revokeUserSessions,
  };
};

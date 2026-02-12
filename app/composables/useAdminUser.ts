import type { UserWithRole } from "better-auth/plugins/admin";

// Extended type for user updates including password
interface UserUpdateData extends Partial<UserWithRole> {
  newPassword?: string;
}

export const useAdminUser = (userId: string) => {
  const user = useState<UserWithRole | null>(`admin-user-${userId}`, () => null);
  const loading = ref(false);
  const error = ref<string | null>(null);

  const fetchUser = async () => {
    if (user.value && !error.value) return; // 有缓存数据且无错误时直接返回

    loading.value = true;
    error.value = null;

    try {
      const { $authClient } = useNuxtApp();
      const result = await $authClient.admin.listUsers({
        query: {
          limit: 1000,
          filterField: "id",
          filterValue: userId,
          filterOperator: "eq",
        },
      });

      if (result.data?.users && result.data.users.length > 0) {
        user.value = result.data.users[0] || null;
      } else {
        throw new Error("User not found");
      }
    } catch (err) {
      error.value = err instanceof Error ? err.message : "Failed to fetch user";
      user.value = null;
    } finally {
      loading.value = false;
    }
  };

  const updateUser = async (updates: UserUpdateData) => {
    if (!user.value) return;

    const { $authClient } = useNuxtApp();

    // 更新角色
    if (updates.role && updates.role !== user.value.role) {
      const result = await $authClient.admin.setRole({
        userId: user.value.id,
        role: updates.role as "user" | "admin", // 明确类型转换
      });

      if (result.error) {
        throw new Error(result.error.message || "Failed to update role");
      }
      // 立即更新本地状态
      user.value.role = updates.role;
    }

    // 更新密码
    if (updates.newPassword) {
      const result = await $authClient.admin.setUserPassword({
        userId: user.value.id,
        newPassword: updates.newPassword,
      });

      if (result.error) {
        throw new Error(result.error.message || "Failed to update password");
      }
    }

    // 使用 Better-Auth 的 updateUser API
    const { email, name, image, emailVerified, banned, banReason, banExpires, ...otherData } =
      updates;
    const updateData = {
      email,
      name,
      image,
      emailVerified,
      banned,
      banReason,
      banExpires,
      ...otherData,
    };

    // 移除不应该通过updateUser更新的字段
    delete updateData.role;
    delete updateData.newPassword;
    delete updateData.id;
    delete updateData.createdAt;
    delete updateData.updatedAt;

    if (Object.keys(updateData).length > 0) {
      const result = await $authClient.admin.updateUser({
        userId: user.value.id,
        data: updateData,
      });

      if (result.error) {
        throw new Error(result.error.message || "Failed to update user");
      }
      // 立即更新本地状态
      if (user.value) {
        Object.assign(user.value, updateData);
      }
    }
  };

  // 禁用用户
  const banUser = async (banReason?: string, banExpiresIn?: number) => {
    if (!user.value) return;

    const { $authClient } = useNuxtApp();
    const result = await $authClient.admin.banUser({
      userId: user.value.id,
      banReason: banReason || "Banned by admin",
      banExpiresIn,
    });

    if (result.error) {
      throw new Error(result.error.message || "Failed to ban user");
    }

    // 更新本地状态
    user.value.banned = true;
    user.value.banReason = banReason || "Banned by admin";
    if (banExpiresIn) {
      user.value.banExpires = new Date(Date.now() + banExpiresIn * 1000);
    }
  };

  // 解禁用户
  const unbanUser = async () => {
    if (!user.value) return;

    const { $authClient } = useNuxtApp();
    const result = await $authClient.admin.unbanUser({
      userId: user.value.id,
    });

    if (result.error) {
      throw new Error(result.error.message || "Failed to unban user");
    }

    // 更新本地状态
    user.value.banned = false;
    user.value.banReason = null;
    user.value.banExpires = null;
  };

  // 删除用户
  const removeUser = async () => {
    if (!user.value) return;

    const { $authClient } = useNuxtApp();
    const result = await $authClient.admin.removeUser({
      userId: user.value.id,
    });

    if (result.error) {
      throw new Error(result.error.message || "Failed to remove user");
    }

    // 清除本地状态
    user.value = null;
  };

  // 冒充用户
  const impersonateUser = async () => {
    if (!user.value) return;

    const { $authClient } = useNuxtApp();
    const result = await $authClient.admin.impersonateUser({
      userId: user.value.id,
    });

    if (result.error) {
      throw new Error(result.error.message || "Failed to impersonate user");
    }

    return result.data;
  };

  return {
    user: readonly(user),
    loading: readonly(loading),
    error: readonly(error),
    fetchUser,
    updateUser,
    banUser,
    unbanUser,
    removeUser,
    impersonateUser,
  };
};

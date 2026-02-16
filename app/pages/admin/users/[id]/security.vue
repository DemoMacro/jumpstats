<script setup lang="ts">
import * as z from "zod";
import type { FormSubmitEvent } from "@nuxt/ui";

const route = useRoute();
const userId = route.params.id as string;
const toast = useToast();

// Use composable for user data
const { user, loading, updateUser, banUser, unbanUser, removeUser } = useAdminUser(userId);

// Password form schema
const passwordSchema = z
  .object({
    newPassword: z.string().min(8, "Password must be at least 8 characters"),
    confirmPassword: z.string().min(8, "Please confirm password"),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: "Passwords don't match",
    path: ["confirmPassword"],
  });

type PasswordSchema = z.output<typeof passwordSchema>;

// Password form state
const passwordForm = reactive({
  newPassword: "",
  confirmPassword: "",
});

// Ban form state
const banForm = reactive({
  reason: "",
  expiresIn: 60 * 60 * 24 * 7, // 7 days
});

// Ban form schema
const banSchema = z.object({
  reason: z.string().min(1, "Ban reason is required"),
  expiresIn: z.number().min(0, "Must be positive"),
});

type BanSchema = z.output<typeof banSchema>;

// Modals state
const showBanModal = ref(false);
const showDeleteModal = ref(false);

// Sessions data
const sessions = ref<any[]>([]);
const sessionsLoading = ref(false);

// Update password
async function onSubmitPassword(event: FormSubmitEvent<PasswordSchema>) {
  if (!user.value) return;

  try {
    await updateUser({
      newPassword: event.data.newPassword,
    });

    toast.add({
      title: "Success",
      description: "User password has been updated.",
      icon: "i-lucide-check",
      color: "success",
    });

    // Reset form
    passwordForm.newPassword = "";
    passwordForm.confirmPassword = "";
  } catch (error) {
    toast.add({
      title: "Error",
      description: error instanceof Error ? error.message : "Failed to update password",
      color: "error",
    });
  }
}

// Handle ban user
const onSubmitBan = async (event: FormSubmitEvent<BanSchema>) => {
  if (!user.value) return;

  try {
    await banUser(event.data.reason, event.data.expiresIn);
    toast.add({
      title: "Success",
      description: `User has been banned${event.data.expiresIn > 0 ? " for " + Math.floor(event.data.expiresIn / (60 * 60 * 24)) + " days" : ""}`,
      color: "success",
    });

    // Reset ban form
    banForm.reason = "";
    banForm.expiresIn = 60 * 60 * 24 * 7;
  } catch (error) {
    toast.add({
      title: "Error",
      description: error instanceof Error ? error.message : "Failed to ban user",
      color: "error",
    });
  }
};

// Handle unban user
const handleUnbanUser = async () => {
  if (!user.value) return;

  try {
    await unbanUser();
    toast.add({
      title: "Success",
      description: "User has been unbanned.",
      color: "success",
    });
  } catch (error) {
    toast.add({
      title: "Error",
      description: error instanceof Error ? error.message : "Failed to unban user",
      color: "error",
    });
  }
};

// Handle delete user
const handleDeleteUser = async () => {
  if (!user.value) return;

  try {
    await removeUser();
    toast.add({
      title: "Success",
      description: "User has been removed permanently.",
      color: "success",
    });

    // Redirect back to users list
    await navigateTo("/admin/users");
  } catch (error) {
    toast.add({
      title: "Error",
      description: error instanceof Error ? error.message : "Failed to remove user",
      color: "error",
    });
  }
};

// Fetch user sessions
async function fetchUserSessions() {
  if (!user.value) return;

  sessionsLoading.value = true;
  try {
    const result = await authClient.admin.listUserSessions({
      userId: user.value.id,
    });

    if (result.data?.sessions) {
      sessions.value = result.data.sessions;
    }
  } catch (error) {
    toast.add({
      title: "Error",
      description: "Failed to fetch user sessions",
      color: "error",
    });
  } finally {
    sessionsLoading.value = false;
  }
}

// Revoke session
async function revokeSession(sessionId: string) {
  try {
    // For individual session revocation, we may need to use a different approach
    // as Better-Auth admin API expects sessionToken which might not be directly available
    // For now, we'll show a message that this feature requires the session token
    toast.add({
      title: "Info",
      description:
        "Individual session revocation requires session token. Use 'Revoke All' to terminate all sessions.",
      color: "info",
    });
  } catch (error) {
    toast.add({
      title: "Error",
      description: "Failed to revoke session",
      color: "error",
    });
  }
}

// Revoke all sessions
async function revokeAllSessions() {
  if (!user.value) return;

  try {
    const result = await authClient.admin.revokeUserSessions({
      userId: user.value.id,
    });

    if (result.error) {
      toast.add({
        title: "Error",
        description: result.error.message || "Failed to revoke sessions",
        color: "error",
      });
      return;
    }

    toast.add({
      title: "Success",
      description: "All sessions revoked successfully",
      color: "success",
    });

    // Refresh sessions
    await fetchUserSessions();
  } catch (error) {
    toast.add({
      title: "Error",
      description: "Failed to revoke sessions",
      color: "error",
    });
  }
}

// Format date
function formatDate(dateString: string) {
  return new Date(dateString).toLocaleString();
}

// Get session status
function getSessionStatus(expiresAt: string) {
  const expiry = new Date(expiresAt);
  const now = new Date();
  return expiry > now;
}

// Auto-fetch sessions on mount when user data is loaded
onMounted(() => {
  if (user.value) {
    fetchUserSessions();
  }
});
</script>

<template>
  <div v-if="loading" class="flex items-center justify-center h-64">
    <UIcon name="i-lucide-loader-2" class="animate-spin size-8" />
  </div>

  <div v-else-if="!user" class="text-center py-8">
    <h3 class="text-lg font-semibold text-muted-foreground mb-2">User not found</h3>
    <p class="text-muted-foreground mb-4">
      The user you're looking for doesn't exist or you don't have permission to view it.
    </p>
    <UButton to="/admin/users">Back to Users</UButton>
  </div>

  <div v-else>
    <UPageCard
      title="Update Password"
      description="Set a new password for this user."
      variant="subtle"
    >
      <UForm
        :schema="passwordSchema"
        :state="passwordForm"
        @submit="onSubmitPassword"
        class="space-y-4"
      >
        <UFormField
          name="newPassword"
          label="New Password"
          description="Enter a new password for the user."
          required
          class="flex max-sm:flex-col justify-between items-start gap-4"
        >
          <UInput v-model="passwordForm.newPassword" type="password" autocomplete="new-password" />
        </UFormField>
        <USeparator />
        <UFormField
          name="confirmPassword"
          label="Confirm Password"
          description="Confirm the new password."
          required
          class="flex max-sm:flex-col justify-between items-start gap-4"
        >
          <UInput
            v-model="passwordForm.confirmPassword"
            type="password"
            autocomplete="new-password"
          />
        </UFormField>
        <USeparator />
        <div class="flex justify-end pt-4">
          <UButton type="submit" color="primary"> Update Password </UButton>
        </div>
      </UForm>
    </UPageCard>

    <!-- Sessions Section -->
    <UPageCard
      title="Sessions"
      description="Manage active sessions across devices."
      variant="subtle"
      class="mt-6"
    >
      <div class="flex justify-between items-center mb-4">
        <div class="text-sm text-muted-foreground">
          {{ sessions.filter((s) => getSessionStatus(s.expiresAt)).length }}
          active sessions
        </div>
        <UButton
          variant="outline"
          size="sm"
          @click="revokeAllSessions"
          :disabled="sessions.length === 0"
        >
          <UIcon name="i-lucide-power" class="size-4 mr-2" />
          Revoke All
        </UButton>
      </div>

      <div v-if="sessionsLoading" class="flex items-center justify-center py-8">
        <UIcon name="i-lucide-loader-2" class="animate-spin size-6" />
      </div>

      <div v-else-if="sessions.length === 0" class="text-center py-8">
        <UIcon name="i-lucide-key-round" class="size-12 text-muted-foreground mx-auto mb-4" />
        <h3 class="text-lg font-semibold text-muted-foreground mb-2">No sessions found</h3>
        <p class="text-muted-foreground">This user doesn't have any active sessions.</p>
      </div>

      <div v-else class="space-y-3">
        <UCard
          v-for="session in sessions"
          :key="session.id"
          class="p-0"
          :class="getSessionStatus(session.expiresAt) ? 'bg-background' : 'bg-muted/30'"
        >
          <div class="flex items-center justify-between">
            <div class="flex items-center gap-3">
              <UIcon name="i-lucide-monitor" class="size-4 text-muted-foreground" />
              <div>
                <div class="font-medium text-sm">Session {{ session.id.slice(-8) }}</div>
                <div class="text-xs text-muted-foreground">
                  Created: {{ formatDate(session.createdAt) }} • Expires:
                  {{ formatDate(session.expiresAt) }}
                </div>
              </div>
            </div>
            <div class="flex items-center gap-2">
              <UBadge
                :color="getSessionStatus(session.expiresAt) ? 'success' : 'secondary'"
                variant="soft"
                size="sm"
              >
                {{ getSessionStatus(session.expiresAt) ? "Active" : "Expired" }}
              </UBadge>
              <UButton
                v-if="getSessionStatus(session.expiresAt)"
                variant="ghost"
                size="sm"
                color="error"
                @click="revokeSession(session.id)"
              >
                <UIcon name="i-lucide-power" class="size-4" />
              </UButton>
            </div>
          </div>
        </UCard>
      </div>
    </UPageCard>

    <UPageCard
      title="Account"
      description="Manage this user's account and access. Some actions cannot be undone."
      class="bg-gradient-to-tl from-error/10 from-5% to-default mt-6"
    >
      <div class="space-y-4">
        <!-- Ban Status and Actions -->
        <div
          v-if="user.banned"
          class="p-4 bg-red-50 dark:bg-red-900/20 rounded-lg border border-red-200 dark:border-red-800"
        >
          <div class="flex items-start gap-3">
            <UIcon name="i-lucide-alert-circle" class="size-5 text-red-500 mt-0.5" />
            <div class="flex-1">
              <p class="font-medium text-red-900 dark:text-red-100">User is banned</p>
              <p v-if="user.banReason" class="text-sm text-red-700 dark:text-red-300 mt-1">
                Reason: {{ user.banReason }}
              </p>
              <p v-if="user.banExpires" class="text-sm text-red-700 dark:text-red-300 mt-1">
                Expires: {{ new Date(user.banExpires).toLocaleString() }}
              </p>
            </div>
          </div>
        </div>

        <!-- Account Actions -->
        <div class="flex flex-wrap gap-3">
          <UButton v-if="!user.banned" @click="showBanModal = true" color="error" variant="outline">
            <UIcon name="i-lucide-ban" class="mr-2" />
            Ban User
          </UButton>
          <UButton v-else @click="handleUnbanUser" color="success" variant="outline">
            <UIcon name="i-lucide-user-check" class="mr-2" />
            Unban User
          </UButton>
          <DashboardUserDeleteModal :user="user">
            <UButton label="Delete account" color="error" />
          </DashboardUserDeleteModal>
        </div>
      </div>
    </UPageCard>

    <!-- Ban Modal -->
    <UModal v-model="showBanModal" title="Ban User">
      <template #body>
        <UForm :schema="banSchema" :state="banForm" @submit="onSubmitBan" class="space-y-4">
          <UFormField
            name="reason"
            label="Ban Reason"
            description="Reason for banning this user."
            required
          >
            <UTextarea v-model="banForm.reason" placeholder="Enter ban reason..." :rows="3" />
          </UFormField>
          <UFormField
            name="expiresIn"
            label="Ban Duration"
            description="How long the ban should last. Leave empty for permanent ban."
          >
            <USelect
              v-model="banForm.expiresIn"
              :items="[
                { label: 'Permanent', value: 0 },
                { label: '1 hour', value: 3600 },
                { label: '1 day', value: 86400 },
                { label: '1 week', value: 604800 },
                { label: '1 month', value: 2592000 },
              ]"
            />
          </UFormField>
          <div class="flex justify-end gap-3 pt-4">
            <UButton variant="outline" @click="showBanModal = false"> Cancel </UButton>
            <UButton type="submit" color="error"> Ban User </UButton>
          </div>
        </UForm>
      </template>
    </UModal>

    <!-- Delete Modal -->
    <UModal v-model="showDeleteModal" title="Delete User">
      <template #body>
        <div class="space-y-4">
          <div class="flex items-start gap-3">
            <UIcon name="i-lucide-alert-triangle" class="size-5 text-red-500 mt-0.5" />
            <div class="flex-1">
              <p class="font-medium text-red-900">Delete User Account</p>
              <p class="text-sm text-muted-foreground mt-1">
                This action cannot be undone. This will permanently delete all data associated with
                {{ user.name || user.email }}.
              </p>
            </div>
          </div>
          <div class="flex justify-end gap-3 pt-4">
            <UButton variant="outline" @click="showDeleteModal = false"> Cancel </UButton>
            <UButton color="error" @click="handleDeleteUser"> Delete User </UButton>
          </div>
        </div>
      </template>
    </UModal>
  </div>
</template>

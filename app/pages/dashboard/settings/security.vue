<script setup lang="ts">
import * as z from "zod";
import type { FormSubmitEvent } from "@nuxt/ui";
import { authClient } from "~/utils/auth";

definePageMeta({
  title: "Security Settings - Dashboard - JS.GS",
});

const toast = useToast();

// Get current user session
const { data: session } = await authClient.useSession(useFetch);

// Password change schema
const passwordSchema = z
  .object({
    currentPassword: z.string().min(1, "Current password is required"),
    newPassword: z.string().min(8, "Password must be at least 8 characters"),
    confirmPassword: z.string().min(1, "Please confirm your password"),
    revokeOtherSessions: z.boolean().optional(),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

type PasswordSchema = z.output<typeof passwordSchema>;

const passwordForm = ref({
  currentPassword: "",
  newPassword: "",
  confirmPassword: "",
  revokeOtherSessions: true,
});

const passwordLoading = ref(false);

// Change password handler
const onPasswordSubmit = async (event: FormSubmitEvent<PasswordSchema>) => {
  passwordLoading.value = true;
  try {
    const { data, error } = await authClient.changePassword({
      currentPassword: event.data.currentPassword,
      newPassword: event.data.newPassword,
      revokeOtherSessions: event.data.revokeOtherSessions ?? true,
    });

    if (error) {
      toast.add({
        title: "Error",
        description: error.message || "Failed to change password",
        color: "error",
      });
      return;
    }

    // Reset form
    passwordForm.value = {
      currentPassword: "",
      newPassword: "",
      confirmPassword: "",
      revokeOtherSessions: true,
    };

    toast.add({
      title: "Success",
      description: "Your password has been changed successfully.",
      icon: "i-lucide-check",
      color: "success",
    });
  } catch (error) {
    toast.add({
      title: "Error",
      description: error instanceof Error ? error.message : "Failed to change password",
      color: "error",
    });
  } finally {
    passwordLoading.value = false;
  }
};

// Sessions management
const sessionsLoading = ref(false);
const sessions = ref<any[]>([]);

// Fetch active sessions
async function fetchSessions() {
  sessionsLoading.value = true;
  try {
    const { data: sessionsData } = await authClient.listSessions();

    sessions.value = sessionsData || [];
  } catch (error) {
    toast.add({
      title: "Error",
      description: error instanceof Error ? error.message : "Failed to fetch sessions",
      color: "error",
    });
  } finally {
    sessionsLoading.value = false;
  }
}

// Revoke specific session
async function revokeSession(token: string) {
  try {
    await authClient.revokeSession({ token });

    toast.add({
      title: "Success",
      description: "Session has been revoked.",
      icon: "i-lucide-check",
      color: "success",
    });

    // Refresh sessions list
    await fetchSessions();
  } catch (error) {
    toast.add({
      title: "Error",
      description: error instanceof Error ? error.message : "Failed to revoke session",
      color: "error",
    });
  }
}

// Revoke all other sessions
async function revokeAllOtherSessions() {
  try {
    // Get current session token to exclude it
    const currentSessionToken = session.value?.session?.token;
    if (!currentSessionToken) {
      toast.add({
        title: "Error",
        description: "Current session not found",
        color: "error",
      });
      return;
    }

    // Revoke all sessions except current one by one
    const revokePromises = sessions.value
      .filter((s) => s.token !== currentSessionToken)
      .map((s) => authClient.revokeSession({ token: s.token }));

    await Promise.all(revokePromises);

    toast.add({
      title: "Success",
      description: "All other sessions have been revoked.",
      icon: "i-lucide-check",
      color: "success",
    });

    // Refresh sessions list
    await fetchSessions();
  } catch (error) {
    toast.add({
      title: "Error",
      description: "Failed to revoke sessions",
      color: "error",
    });
  }
}

// Delete account
const deleteAccountModalOpen = ref(false);
const deleteAccountLoading = ref(false);
const deletePassword = ref("");

const deleteAccountSchema = z.object({
  password: z.string().min(1, "Password is required"),
});

const deleteAccountForm = reactive({
  password: "",
});

async function deleteAccount() {
  deleteAccountLoading.value = true;
  try {
    const { error } = await authClient.deleteUser({
      password: deleteAccountForm.password,
    });

    if (error) {
      toast.add({
        title: "Error",
        description: error.message || "Failed to delete account",
        color: "error",
      });
      return;
    }

    toast.add({
      title: "Success",
      description: "Your account has been deleted",
      color: "success",
    });

    deleteAccountModalOpen.value = false;
    deleteAccountForm.password = "";

    // Redirect to home page
    await navigateTo("/");
  } catch (error) {
    toast.add({
      title: "Error",
      description: "An unexpected error occurred",
      color: "error",
    });
  } finally {
    deleteAccountLoading.value = false;
  }
}

// Format date
function formatDate(dateString: string | undefined) {
  if (!dateString) return "";
  return new Date(dateString).toLocaleString();
}

// Get session status
function getSessionStatus(expiresAt: string | undefined) {
  if (!expiresAt) return false;
  const expiry = new Date(expiresAt);
  const now = new Date();
  return expiry > now;
}

// Fetch sessions on mount
onMounted(() => {
  fetchSessions();
});
</script>

<template>
  <div v-if="!session?.user" class="text-center py-8">
    <h3 class="text-lg font-semibold mb-2">Not authenticated</h3>
    <p class="mb-4">Please sign in to view your security settings.</p>
    <UButton to="/auth/sign-in">Sign In</UButton>
  </div>

  <div v-else class="space-y-6">
    <!-- Password Section -->
    <UPageCard
      title="Change Password"
      description="Set a new password for your account."
      variant="subtle"
    >
      <UForm
        :schema="passwordSchema"
        :state="passwordForm"
        @submit="onPasswordSubmit"
        class="space-y-4"
      >
        <UFormField
          name="currentPassword"
          label="Current password"
          required
          class="flex max-sm:flex-col justify-between items-start gap-4"
        >
          <UInput
            v-model="passwordForm.currentPassword"
            type="password"
            placeholder="Enter your current password"
            autocomplete="current-password"
          />
        </UFormField>
        <UFormField
          name="newPassword"
          label="New password"
          description="Must be at least 8 characters"
          required
          class="flex max-sm:flex-col justify-between items-start gap-4"
        >
          <UInput
            v-model="passwordForm.newPassword"
            type="password"
            placeholder="Enter your new password"
            autocomplete="new-password"
          />
        </UFormField>
        <UFormField
          name="confirmPassword"
          label="Confirm password"
          description="Confirm your new password"
          required
          class="flex max-sm:flex-col justify-between items-start gap-4"
        >
          <UInput
            v-model="passwordForm.confirmPassword"
            type="password"
            placeholder="Confirm your new password"
            autocomplete="new-password"
          />
        </UFormField>
        <UFormField
          name="revokeOtherSessions"
          label="Revoke other sessions"
          description="Sign out all other devices and browsers"
          class="flex max-sm:flex-col justify-between items-start gap-4"
        >
          <UCheckbox v-model="passwordForm.revokeOtherSessions" />
        </UFormField>

        <div class="flex justify-start pt-4">
          <UButton type="submit" :loading="passwordLoading"> Change password </UButton>
        </div>
      </UForm>
    </UPageCard>

    <!-- Sessions Section -->
    <UPageCard
      variant="subtle"
      :ui="{
        container: 'p-0 sm:p-0 gap-y-0',
        wrapper: 'items-stretch',
        header: 'p-4 mb-0 border-b border-default',
      }"
    >
      <template #header>
        <div class="flex items-center justify-between gap-3">
          <div class="text-sm text-muted">
            {{ sessions.filter((s) => getSessionStatus(s.expiresAt)).length }}
            active sessions
          </div>
          <UButton
            variant="outline"
            size="sm"
            @click="revokeAllOtherSessions"
            :disabled="sessions.length <= 1"
          >
            <UIcon name="i-lucide-power" class="size-4 mr-2" />
            Revoke all other sessions
          </UButton>
        </div>
      </template>

      <!-- Loading State -->
      <div v-if="sessionsLoading" class="flex items-center justify-center py-8">
        <UIcon name="i-lucide-loader-2" class="animate-spin size-6" />
      </div>

      <!-- Empty State -->
      <div v-else-if="sessions.length === 0" class="text-center py-8">
        <UIcon name="i-lucide-key-round" class="size-12 text-muted mx-auto mb-4" />
        <h3 class="text-lg font-semibold mb-2">No sessions found</h3>
        <p class="text-sm text-muted">You don't have any active sessions.</p>
      </div>

      <!-- Sessions List -->
      <ul v-else role="list" class="divide-y divide-default">
        <li
          v-for="sessionItem in sessions"
          :key="sessionItem.token"
          class="flex items-center justify-between gap-3 py-4 px-4 sm:px-6"
        >
          <div class="flex items-center gap-3 min-w-0">
            <div class="size-10 bg-primary/10 rounded-full flex items-center justify-center">
              <UIcon name="i-lucide-monitor" class="size-5" />
            </div>

            <div class="text-sm min-w-0">
              <p class="font-medium truncate">Session {{ sessionItem.token.slice(-8) }}</p>
              <p class="text-muted truncate">
                Created: {{ formatDate(sessionItem.createdAt) }} • Expires:
                {{ formatDate(sessionItem.expiresAt) }}
              </p>
            </div>
          </div>

          <div class="flex items-center gap-3">
            <UBadge
              :color="getSessionStatus(sessionItem.expiresAt) ? 'success' : 'secondary'"
              variant="soft"
            >
              {{ getSessionStatus(sessionItem.expiresAt) ? "Active" : "Expired" }}
            </UBadge>

            <UButton
              v-if="getSessionStatus(sessionItem.expiresAt)"
              icon="i-lucide-power"
              color="error"
              variant="ghost"
              size="sm"
              @click="revokeSession(sessionItem.token)"
            />
          </div>
        </li>
      </ul>
    </UPageCard>

    <!-- Delete Account Section -->
    <UPageCard
      title="Delete Account"
      description="Permanently delete your account and all associated data. This action is not reversible."
      class="bg-linear-to-tl from-error/10 from-5% to-default"
    >
      <template #footer>
        <UButton color="error" @click="deleteAccountModalOpen = true"> Delete account </UButton>
      </template>
    </UPageCard>

    <!-- Delete Account Modal -->
    <UModal
      v-model:open="deleteAccountModalOpen"
      title="Delete Account"
      description="This action cannot be undone"
    >
      <template #body>
        <div class="space-y-4">
          <UAlert
            icon="i-lucide-alert-triangle"
            color="error"
            variant="subtle"
            title="Warning"
            description="This will permanently delete your account and all associated data."
          />

          <UForm
            :schema="deleteAccountSchema"
            :state="deleteAccountForm"
            class="space-y-4"
            @submit="deleteAccount"
          >
            <UFormField
              name="password"
              label="Password"
              description="Enter your password to confirm deletion"
            >
              <UInput
                v-model="deleteAccountForm.password"
                type="password"
                placeholder="Enter your password"
                autocomplete="current-password"
                :disabled="deleteAccountLoading"
                class="w-full"
              />
            </UFormField>

            <div class="flex justify-end gap-2">
              <UButton
                variant="outline"
                @click="deleteAccountModalOpen = false"
                :disabled="deleteAccountLoading"
              >
                Cancel
              </UButton>
              <UButton
                color="error"
                type="submit"
                :loading="deleteAccountLoading"
                :disabled="!deleteAccountForm.password"
              >
                Delete Account
              </UButton>
            </div>
          </UForm>
        </div>
      </template>
    </UModal>
  </div>
</template>

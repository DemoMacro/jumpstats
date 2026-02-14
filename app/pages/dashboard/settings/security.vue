<script setup lang="ts">
import * as z from "zod";
import type { FormSubmitEvent } from "@nuxt/ui";
import { authClient } from "~/utils/auth";

definePageMeta({
  title: "Security Settings - Dashboard - JumpStats",
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

  <div v-else class="flex flex-col gap-6">
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
        <div class="flex justify-end pt-4">
          <UButton type="submit" :loading="passwordLoading"> Change password </UButton>
        </div>
      </UForm>
    </UPageCard>

    <!-- Sessions Section -->
    <UPageCard
      title="Active Sessions"
      description="Manage your active sessions across devices."
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
          @click="revokeAllOtherSessions"
          :disabled="sessions.length <= 1"
        >
          <UIcon name="i-lucide-power" class="size-4 mr-2" />
          Revoke all other sessions
        </UButton>
      </div>

      <div v-if="sessionsLoading" class="flex items-center justify-center py-8">
        <UIcon name="i-lucide-loader-2" class="animate-spin size-6" />
      </div>

      <div v-else-if="sessions.length === 0" class="text-center py-8">
        <UIcon name="i-lucide-key-round" class="size-12 text-muted-foreground mx-auto mb-4" />
        <h3 class="text-lg font-semibold text-muted-foreground mb-2">No sessions found</h3>
        <p class="text-muted-foreground">You don't have any active sessions.</p>
      </div>

      <div v-else class="space-y-3">
        <UCard
          v-for="sessionItem in sessions"
          :key="sessionItem.token"
          class="p-0"
          :class="getSessionStatus(sessionItem.expiresAt) ? 'bg-background' : 'bg-muted/30'"
        >
          <div class="flex items-center justify-between">
            <div class="flex items-center gap-3">
              <UIcon name="i-lucide-monitor" class="size-4 text-muted-foreground" />
              <div>
                <div class="font-medium text-sm">Session {{ sessionItem.token.slice(-8) }}</div>
                <div class="text-xs text-muted-foreground">
                  Created: {{ formatDate(sessionItem.createdAt) }} • Expires:
                  {{ formatDate(sessionItem.expiresAt) }}
                </div>
              </div>
            </div>
            <div class="flex items-center gap-2">
              <UBadge
                :color="getSessionStatus(sessionItem.expiresAt) ? 'success' : 'secondary'"
                variant="soft"
                size="sm"
              >
                {{ getSessionStatus(sessionItem.expiresAt) ? "Active" : "Expired" }}
              </UBadge>
              <UButton
                v-if="getSessionStatus(sessionItem.expiresAt)"
                variant="ghost"
                size="sm"
                color="error"
                @click="revokeSession(sessionItem.token)"
              >
                <UIcon name="i-lucide-power" class="size-4" />
              </UButton>
            </div>
          </div>
        </UCard>
      </div>
    </UPageCard>
  </div>
</template>

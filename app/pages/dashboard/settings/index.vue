<script setup lang="ts">
import * as z from "zod";
import type { FormSubmitEvent } from "@nuxt/ui";
import { authClient } from "~/utils/auth";

definePageMeta({
  title: "Profile Settings - Dashboard - JumpStats",
});

const toast = useToast();

// Get current user session
const { data: session } = await authClient.useSession(useFetch);

// Form schema matching Nuxt UI dashboard settings
const profileSchema = z.object({
  name: z.string().min(2, "Too short"),
  username: z
    .string()
    .min(3, "Username must be at least 3 characters")
    .regex(
      /^[a-zA-Z0-9_-]+$/,
      "Username can only contain letters, numbers, hyphens and underscores",
    )
    .optional(),
  email: z.string().email("Invalid email"),
  image: z.string().url("Invalid URL").optional().or(z.literal("")),
});

type ProfileSchema = z.output<typeof profileSchema>;

// Form state derived from user data
const profile = reactive({
  name: "",
  username: "",
  email: "",
  image: "",
});

// Initialize profile from session data
if (session.value?.user) {
  profile.name = session.value.user.name || "";
  profile.username = session.value.user.username || "";
  profile.email = session.value.user.email || "";
  profile.image = session.value.user.image || "";
}

// Loading state for form submission
const loading = ref(false);

// Update user profile
const onSubmit = async (event: FormSubmitEvent<ProfileSchema>) => {
  if (!session.value?.user) return;

  loading.value = true;
  try {
    // Check if email is being changed
    const emailChanged = event.data.email !== session.value.user.email;

    // If email changed, initiate email change flow
    if (emailChanged) {
      const { error } = await authClient.changeEmail({
        newEmail: event.data.email,
        callbackURL: "/dashboard/settings",
      });

      if (error) {
        toast.add({
          title: "Error",
          description: error.message || "Failed to change email",
          color: "error",
        });
        return;
      }

      toast.add({
        title: "Email Change Initiated",
        description: "Please check your current and new email for verification links",
        icon: "i-lucide-mail",
        color: "success",
      });
      return;
    }

    // Update other profile fields
    const { data, error } = await authClient.updateUser({
      name: event.data.name,
      username: event.data.username || undefined,
      image: event.data.image || undefined,
    });

    if (error) {
      toast.add({
        title: "Error",
        description: error.message || "Failed to update profile",
        color: "error",
      });
      return;
    }

    // Refresh session after successful update by fetching it again
    const { data: newSession } = await authClient.getSession();
    if (newSession) {
      session.value = newSession as typeof session.value;
      // Update profile form with new data
      if (newSession.user) {
        profile.name = newSession.user.name || "";
        profile.username = newSession.user.username || "";
        profile.email = newSession.user.email || "";
        profile.image = newSession.user.image || "";
      }
    }

    toast.add({
      title: "Success",
      description: "Your profile has been updated.",
      icon: "i-lucide-check",
      color: "success",
    });
  } catch (error) {
    toast.add({
      title: "Error",
      description: error instanceof Error ? error.message : "Failed to update profile",
      color: "error",
    });
  } finally {
    loading.value = false;
  }
};
</script>

<template>
  <div v-if="!session?.user" class="text-center py-8">
    <h3 class="text-lg font-semibold text-muted-foreground mb-2">Not authenticated</h3>
    <p class="text-muted-foreground mb-4">Please sign in to view your profile settings.</p>
    <UButton to="/auth/sign-in">Sign In</UButton>
  </div>

  <div v-else>
    <UForm id="settings" :schema="profileSchema" :state="profile" @submit="onSubmit">
      <UPageCard
        title="Profile"
        description="These informations will be displayed publicly."
        variant="naked"
        orientation="horizontal"
        class="mb-4"
      >
        <div class="flex gap-3 w-fit lg:ms-auto">
          <UButton
            to="/dashboard/settings/security"
            label="Security Settings"
            color="neutral"
            variant="outline"
          />
          <UButton
            form="settings"
            label="Save changes"
            color="neutral"
            type="submit"
            :loading="loading"
          />
        </div>
      </UPageCard>

      <UPageCard variant="subtle">
        <UFormField
          name="name"
          label="Name"
          description="Will appear on receipts, invoices, and other communication."
          required
          class="flex max-sm:flex-col justify-between items-start gap-4"
        >
          <UInput v-model="profile.name" autocomplete="off" />
        </UFormField>
        <USeparator />
        <UFormField
          name="username"
          label="Username"
          description="Letters, numbers, hyphens and underscores only."
          class="flex max-sm:flex-col justify-between items-start gap-4"
        >
          <UInput v-model="profile.username" autocomplete="off" />
        </UFormField>
        <USeparator />
        <UFormField
          name="email"
          label="Email"
          description="Changing your email will require verification."
          required
          class="flex max-sm:flex-col justify-between items-start gap-4"
        >
          <UInput v-model="profile.email" type="email" />
        </UFormField>
        <USeparator />
        <UFormField
          name="image"
          label="Avatar URL"
          description="URL to your profile image."
          class="flex max-sm:flex-col justify-between items-start gap-4"
        >
          <UInput
            v-model="profile.image"
            placeholder="https://example.com/avatar.jpg"
            autocomplete="off"
          />
        </UFormField>
      </UPageCard>
    </UForm>
  </div>
</template>

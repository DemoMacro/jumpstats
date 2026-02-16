<script setup lang="ts">
import * as z from "zod";
import type { FormSubmitEvent } from "@nuxt/ui";

const route = useRoute();
const userId = route.params.id as string;
const toast = useToast();

// Use composable for user data
const { user, loading, updateUser } = useUser(userId);

// Form schema matching Nuxt UI dashboard settings
const profileSchema = z.object({
  name: z.string().min(2, "Too short"),
  email: z.string().email("Invalid email"),
  role: z.enum(["user", "admin"]).refine((val) => val !== undefined, {
    message: "Please select a role",
  }),
  image: z.string().url("Invalid URL").optional().or(z.literal("")),
  emailVerified: z.boolean().optional(),
});

type ProfileSchema = z.output<typeof profileSchema>;

// Form state derived from user data
const profile = computed(() => {
  if (!user.value) return { name: "", email: "", role: "user" as const, image: "" };
  return {
    name: user.value.name || "",
    email: user.value.email || "",
    role: (user.value.role as "user" | "admin") || "user",
    image: user.value.image || "",
    emailVerified: user.value.emailVerified || false,
  };
});

// Update user profile
const onSubmit = async (event: FormSubmitEvent<ProfileSchema>) => {
  if (!user.value) return;

  try {
    await updateUser(event.data);
    toast.add({
      title: "Success",
      description: "User profile has been updated.",
      icon: "i-lucide-check",
      color: "success",
    });
  } catch (error) {
    toast.add({
      title: "Error",
      description: error instanceof Error ? error.message : "Failed to update user",
      color: "error",
    });
  }
};
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
            :to="`/admin/users/${userId}/security`"
            label="Security Settings"
            color="neutral"
            variant="outline"
          />
          <UButton form="settings" label="Save changes" color="neutral" type="submit" />
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
          name="email"
          label="Email"
          description="This is your email address."
          required
          class="flex max-sm:flex-col justify-between items-start gap-4"
        >
          <UInput v-model="profile.email" type="email" autocomplete="off" />
        </UFormField>
        <USeparator />
        <UFormField
          name="image"
          label="Avatar URL"
          description="URL to user's profile image."
          class="flex max-sm:flex-col justify-between items-start gap-4"
        >
          <UInput
            v-model="profile.image"
            placeholder="https://example.com/avatar.jpg"
            autocomplete="off"
          />
        </UFormField>
        <USeparator />
        <UFormField
          name="emailVerified"
          label="Email Verified"
          description="Whether the user's email has been verified."
          class="flex max-sm:flex-col justify-between items-start gap-4"
        >
          <UCheckbox v-model="profile.emailVerified" />
        </UFormField>
        <USeparator />
        <UFormField
          name="role"
          label="Role"
          description="User role determines access permissions."
          required
          class="flex max-sm:flex-col justify-between items-start gap-4"
        >
          <USelect
            v-model="profile.role"
            :items="[
              { label: 'User', value: 'user' },
              { label: 'Admin', value: 'admin' },
            ]"
            class="w-full"
          />
        </UFormField>
      </UPageCard>
    </UForm>
  </div>
</template>

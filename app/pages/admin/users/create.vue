<script setup lang="ts">
import * as z from "zod";
import type { FormSubmitEvent } from "@nuxt/ui";
import { authClient } from "~/utils/auth";

definePageMeta({
  layout: "dashboard",
  title: "Create User - Admin - JumpStats",
});

const toast = useToast();

// Form schema
const schema = z.object({
  email: z.string().email("Invalid email address"),
  name: z.string().min(1, "Name is required"),
  username: z
    .string()
    .min(5, "Username must be at least 5 characters")
    .max(30, "Username must be at most 30 characters")
    .regex(
      /^[a-zA-Z0-9_-]+$/,
      "Username can only contain letters, numbers, underscores, and hyphens",
    ),
  password: z.string().min(6, "Password must be at least 6 characters"),
  role: z.enum(["user", "admin"]).refine((val) => val !== undefined, {
    message: "Please select a role",
  }),
});

type Schema = z.output<typeof schema>;

// Form state
const state = reactive<Schema>({
  email: "",
  name: "",
  username: "",
  password: "",
  role: "user",
});

const submitting = ref(false);

// Create user
async function createUser(event: FormSubmitEvent<Schema>) {
  submitting.value = true;
  try {
    const result = await authClient.admin.createUser({
      email: event.data.email,
      name: event.data.name,
      password: event.data.password,
      role: event.data.role,
      data: {
        username: event.data.username,
        displayUsername: event.data.username,
      },
    });

    if (result.error) {
      toast.add({
        title: "Error",
        description: result.error.message || "Failed to create user",
        color: "error",
      });
      return;
    }

    toast.add({
      title: "Success",
      description: `User ${event.data.email} has been created successfully`,
      color: "success",
    });

    // Redirect to users list
    await navigateTo("/admin/users");
  } catch (error) {
    toast.add({
      title: "Error",
      description: "An unexpected error occurred while creating user",
      color: "error",
    });
  } finally {
    submitting.value = false;
  }
}
</script>

<template>
  <UDashboardPanel id="create-user">
    <template #header>
      <UDashboardNavbar title="Create User">
        <template #leading>
          <UDashboardSidebarCollapse />
        </template>
      </UDashboardNavbar>
    </template>

    <template #body>
      <div class="flex flex-col gap-4 sm:gap-6 lg:gap-12 w-full lg:max-w-2xl mx-auto">
        <UForm id="create-user" :schema="schema" :state="state" @submit="createUser">
          <UPageCard
            title="Create User"
            description="Create a new user account with appropriate permissions."
            variant="naked"
            orientation="horizontal"
            class="mb-4"
          >
            <div class="flex gap-3 ms-auto">
              <UButton variant="outline" to="/admin/users" :disabled="submitting"> Cancel </UButton>
              <UButton
                form="create-user"
                label="Create User"
                color="primary"
                type="submit"
                :loading="submitting"
              >
                <template #leading>
                  <UIcon name="i-lucide-user-plus" />
                </template>
              </UButton>
            </div>
          </UPageCard>

          <UPageCard variant="subtle">
            <UFormField
              name="email"
              label="Email Address"
              description="The user's email address for login and communications."
              required
              class="flex max-sm:flex-col justify-between items-start gap-4"
            >
              <UInput
                v-model="state.email"
                type="email"
                placeholder="user@example.com"
                autocomplete="off"
                :disabled="submitting"
              />
            </UFormField>
            <USeparator />
            <UFormField
              name="name"
              label="Full Name"
              description="The user's display name."
              required
              class="flex max-sm:flex-col justify-between items-start gap-4"
            >
              <UInput
                v-model="state.name"
                placeholder="John Doe"
                autocomplete="off"
                :disabled="submitting"
              />
            </UFormField>
            <USeparator />
            <UFormField
              name="username"
              label="Username"
              description="Unique username for the user."
              required
              class="flex max-sm:flex-col justify-between items-start gap-4"
            >
              <UInput
                v-model="state.username"
                placeholder="johndoe"
                autocomplete="off"
                :disabled="submitting"
              />
            </UFormField>
            <USeparator />
            <UFormField
              name="password"
              label="Password"
              description="Initial password for the user account."
              required
              class="flex max-sm:flex-col justify-between items-start gap-4"
            >
              <div class="flex gap-2">
                <UInput
                  v-model="state.password"
                  type="password"
                  placeholder="Enter password"
                  autocomplete="off"
                  :disabled="submitting"
                  class="flex-1"
                />
              </div>
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
                v-model="state.role"
                :items="[
                  { label: 'User', value: 'user' },
                  { label: 'Admin', value: 'admin' },
                ]"
                class="w-full"
                :disabled="submitting"
              />
            </UFormField>
          </UPageCard>
        </UForm>
      </div>
    </template>
  </UDashboardPanel>
</template>

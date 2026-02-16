<script setup lang="ts">
import * as z from "zod";
import type { FormSubmitEvent } from "@nuxt/ui";

definePageMeta({
  layout: "dashboard",
  title: "Create Organization - Dashboard - JumpStats",
});

const toast = useToast();

// Form schema
const schema = z.object({
  name: z.string().min(1, "Organization name is required"),
  slug: z
    .string()
    .min(4, "Slug is required")
    .regex(/^[a-z0-9-]+$/, "Slug must contain only lowercase letters, numbers, and hyphens"),
  logo: z.string().url("Invalid URL").optional().or(z.literal("")),
});

type Schema = z.output<typeof schema>;

// Form state
const state = reactive<Schema>({
  name: "",
  slug: "",
  logo: "",
});

const submitting = ref(false);
const userEditedSlug = ref(false);

// Auto-generate slug from name
watch(
  () => state.name,
  (newName) => {
    if (newName && !userEditedSlug.value) {
      state.slug = newName
        .toLowerCase()
        .replace(/[^a-z0-9\s-]/g, "")
        .replace(/\s+/g, "-")
        .replace(/-+/g, "-")
        .trim();
    }
  },
);

// Track when user manually edits slug
watch(
  () => state.slug,
  (newSlug, oldSlug) => {
    if (oldSlug !== undefined && newSlug !== oldSlug && state.name !== "") {
      const expectedSlug = state.name
        .toLowerCase()
        .replace(/[^a-z0-9\s-]/g, "")
        .replace(/\s+/g, "-")
        .replace(/-+/g, "-")
        .trim();

      if (newSlug !== expectedSlug) {
        userEditedSlug.value = true;
      }
    }
  },
);

// Create organization
async function createOrganization(event: FormSubmitEvent<Schema>) {
  submitting.value = true;
  try {
    const result = await authClient.organization.create({
      name: event.data.name,
      slug: event.data.slug,
      logo: event.data.logo || undefined,
    });

    if (result.error) {
      toast.add({
        title: "Error",
        description: result.error.message || "Failed to create organization",
        color: "error",
      });
      return;
    }

    toast.add({
      title: "Success",
      description: `Organization "${event.data.name}" has been created successfully`,
      icon: "i-lucide-check",
      color: "success",
    });

    // Redirect to organization overview
    await navigateTo("/dashboard/org");
  } catch (error) {
    toast.add({
      title: "Error",
      description: error instanceof Error ? error.message : "An unexpected error occurred",
      color: "error",
    });
  } finally {
    submitting.value = false;
  }
}
</script>

<template>
  <UDashboardPanel id="create-organization">
    <template #header>
      <UDashboardNavbar title="Create Organization">
        <template #leading>
          <UDashboardSidebarCollapse />
        </template>
      </UDashboardNavbar>
    </template>

    <template #body>
      <div class="flex flex-col gap-4 sm:gap-6 lg:gap-12 w-full lg:max-w-2xl mx-auto">
        <UForm
          id="create-organization"
          :schema="schema"
          :state="state"
          @submit="createOrganization"
        >
          <UPageCard
            title="Create Organization"
            description="Create a new organization for managing teams and resources."
            variant="naked"
            orientation="horizontal"
            class="mb-4"
          >
            <div class="flex gap-3 ms-auto">
              <UButton variant="outline" to="/dashboard" :disabled="submitting"> Cancel </UButton>
              <UButton
                form="create-organization"
                label="Create Organization"
                color="primary"
                type="submit"
                :loading="submitting"
              >
                <template #leading>
                  <UIcon name="i-lucide-building" />
                </template>
              </UButton>
            </div>
          </UPageCard>

          <UPageCard variant="subtle">
            <DashboardOrgForm :schema="schema" :state="state" :submitting="submitting" />
          </UPageCard>
        </UForm>
      </div>
    </template>
  </UDashboardPanel>
</template>

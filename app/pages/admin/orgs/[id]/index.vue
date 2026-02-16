<script setup lang="ts">
import * as z from "zod";
import type { FormSubmitEvent } from "@nuxt/ui";

const route = useRoute();
const orgId = route.params.id as string;
const toast = useToast();

// Use composable for organization data
const { organization, loading, updateOrg } = useAdminOrg(orgId);

// Form schema matching Nuxt UI dashboard settings
const profileSchema = z.object({
  name: z.string().min(2, "Too short"),
  slug: z
    .string()
    .min(4, "Too short")
    .regex(/^[a-z0-9-]+$/, "Slug must contain only lowercase letters, numbers, and hyphens"),
  logo: z.string().url("Invalid URL").optional().or(z.literal("")),
});

type ProfileSchema = z.output<typeof profileSchema>;

// Form state derived from organization data
const profile = computed(() => {
  if (!organization.value) return { name: "", slug: "", logo: "" };
  return {
    name: organization.value.name || "",
    slug: organization.value.slug || "",
    logo: organization.value.logo || "",
  };
});

// Update organization profile
const onSubmit = async (event: FormSubmitEvent<ProfileSchema>) => {
  if (!organization.value) return;

  try {
    await updateOrg(event.data);
    toast.add({
      title: "Success",
      description: "Your settings have been updated.",
      icon: "i-lucide-check",
      color: "success",
    });
  } catch (error) {
    toast.add({
      title: "Error",
      description: error instanceof Error ? error.message : "Failed to update organization",
      color: "error",
    });
  }
};
</script>

<template>
  <div v-if="loading" class="flex items-center justify-center h-64">
    <UIcon name="i-lucide-loader-2" class="animate-spin size-8" />
  </div>

  <div v-else-if="!organization" class="text-center py-8">
    <h3 class="text-lg font-semibold text-muted-foreground mb-2">Organization not found</h3>
    <p class="text-muted-foreground mb-4">
      The organization you're looking for doesn't exist or you don't have permission to view it.
    </p>
    <UButton to="/admin/orgs">Back to Organizations</UButton>
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
        <UButton
          form="settings"
          label="Save changes"
          color="neutral"
          type="submit"
          class="w-fit lg:ms-auto"
        />
      </UPageCard>

      <UPageCard variant="subtle">
        <DashboardOrgForm :schema="profileSchema" :state="profile" :submitting="loading" />
      </UPageCard>
    </UForm>
  </div>
</template>

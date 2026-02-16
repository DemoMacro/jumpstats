<script setup lang="ts">
import * as z from "zod";
import type { FormSubmitEvent } from "@nuxt/ui";

const toast = useToast();

// Get active organization
const activeOrgResult = authClient.useActiveOrganization();
const activeOrg = computed(() => activeOrgResult.value.data);

const loading = ref(false);
const error = ref<string | null>(null);

// Form schema matching Nuxt UI dashboard settings
const profileSchema = z.object({
  name: z.string().min(2, "Too short"),
  slug: z
    .string()
    .min(4, "Too short")
    .regex(/^[a-z0-9-]+$/, "Slug must contain only lowercase letters, numbers, and hyphens"),
  logo: z.string().url("Invalid URL").optional().or(z.literal("")),
  metadata: z.string().optional(),
});

type ProfileSchema = z.output<typeof profileSchema>;

// Form state derived from organization data
const profile = computed(() => {
  if (!activeOrg.value) return { name: "", slug: "", logo: "", metadata: "" };
  return {
    name: activeOrg.value.name || "",
    slug: activeOrg.value.slug || "",
    logo: activeOrg.value.logo || "",
    metadata: activeOrg.value.metadata ? JSON.stringify(activeOrg.value.metadata, null, 2) : "",
  };
});

// Update organization profile
const onSubmit = async (event: FormSubmitEvent<ProfileSchema>) => {
  if (!activeOrg.value) return;

  loading.value = true;
  try {
    const metadata = event.data.metadata ? JSON.parse(event.data.metadata) : undefined;

    const { error: err } = await authClient.organization.update({
      data: {
        name: event.data.name,
        slug: event.data.slug,
        logo: event.data.logo || undefined,
        metadata,
      },
    });

    if (err) {
      toast.add({
        title: "Error",
        description: err.message || "Failed to update organization",
        color: "error",
      });
      return;
    }

    toast.add({
      title: "Success",
      description: "Your settings have been updated.",
      icon: "i-lucide-check",
      color: "success",
    });
  } catch (err) {
    toast.add({
      title: "Error",
      description: err instanceof Error ? err.message : "Failed to update organization",
      color: "error",
    });
  } finally {
    loading.value = false;
  }
};
</script>

<template>
  <div v-if="!activeOrg" class="text-center py-8">
    <h3 class="text-lg font-semibold text-muted-foreground mb-2">Organization not found</h3>
    <p class="text-muted-foreground mb-4">
      Please select an organization from the menu or create a new one.
    </p>
    <UButton to="/dashboard/org/create">Create Organization</UButton>
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
          :loading="loading"
          class="w-fit lg:ms-auto"
        />
      </UPageCard>

      <UPageCard variant="subtle">
        <UFormField
          name="name"
          label="Name"
          description="Will appear on receipts, invoices, and other communication."
          required
          class="flex max-sm:flex-col justify-between items-start gap-4"
        >
          <UInput v-model="profile.name" autocomplete="off" :disabled="loading" />
        </UFormField>
        <USeparator />
        <UFormField
          name="slug"
          label="Slug"
          description="Unique identifier used in URLs and API calls."
          required
          class="flex max-sm:flex-col justify-between items-start gap-4"
        >
          <UInput v-model="profile.slug" autocomplete="off" :disabled="loading" />
        </UFormField>
        <USeparator />
        <UFormField
          name="logo"
          label="Logo URL"
          description="Organization logo image URL."
          class="flex max-sm:flex-col justify-between items-start gap-4"
        >
          <UInput
            v-model="profile.logo"
            type="url"
            placeholder="https://example.com/logo.png"
            autocomplete="off"
            :disabled="loading"
          />
        </UFormField>
        <USeparator />
        <UFormField
          name="metadata"
          label="Metadata"
          description="Additional metadata in JSON format."
          class="flex max-sm:flex-col justify-between items-start gap-4"
        >
          <UTextarea
            v-model="profile.metadata"
            placeholder='{"customField": "value"}'
            :rows="4"
            :disabled="loading"
          />
        </UFormField>
        <USeparator />
      </UPageCard>
    </UForm>
  </div>
</template>

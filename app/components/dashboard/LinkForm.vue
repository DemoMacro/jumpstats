<script setup lang="ts">
import * as z from "zod";
import type { FormSubmitEvent } from "@nuxt/ui";
import { useDomains } from "~/composables/useDomains";
import { useOrganizations } from "~/composables/useOrganizations";

interface Props {
  schema: z.ZodObject<any>;
  state: Partial<Record<string, any>>;
  submitting?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  submitting: false,
});

const emit = defineEmits<{
  submit: [event: FormSubmitEvent<any>];
}>();

const { domainOptions, loading: domainsLoading } = useDomains();

// Get user's organizations
const { organizations, loading: orgsLoading } = useOrganizations();

// Organization options for select
const organizationOptions = computed(() => [
  { label: "Personal", value: "personal" },
  ...organizations.value.map((org) => ({
    label: org.name,
    value: org.id,
  })),
]);
</script>

<template>
  <UPageCard variant="subtle" class="mb-4">
    <UFormField
      name="organizationId"
      label="Organization"
      description="Choose whether this link belongs to you personally or to an organization"
      required
      class="flex max-sm:flex-col justify-between items-start gap-4"
    >
      <USelect
        v-model="state.organizationId"
        :items="organizationOptions"
        :disabled="submitting || orgsLoading"
        class="w-48"
        icon="i-lucide-building"
      />
    </UFormField>

    <USeparator />

    <UFormField
      name="originalUrl"
      label="Destination URL"
      description="The full URL you want to shorten (e.g., https://example.com/very-long-url)."
      required
      class="flex flex-col gap-2"
    >
      <UInput
        v-model="state.originalUrl"
        placeholder="https://example.com/very-long-url"
        :disabled="submitting"
        class="w-full"
      />
    </UFormField>

    <USeparator />

    <UFormField
      name="domainId"
      label="Custom Domain (Optional)"
      description="Select a verified custom domain for this link"
      class="flex max-sm:flex-col justify-between items-start gap-4"
    >
      <USelect
        v-if="domainOptions.length > 0"
        v-model="state.domainId"
        :items="domainOptions"
        placeholder="Default"
        icon="i-lucide-globe"
        :disabled="submitting || domainsLoading"
        class="w-48"
      />
    </UFormField>

    <USeparator />

    <UFormField
      name="title"
      label="Title"
      description="A descriptive title for your link (optional)."
      class="flex max-sm:flex-col justify-between items-start gap-4"
    >
      <UInput
        v-model="state.title"
        placeholder="My Awesome Link"
        :disabled="submitting"
        class="w-48"
      />
    </UFormField>

    <USeparator />

    <UFormField
      name="description"
      label="Description"
      description="Additional details about this link (optional)."
      class="flex flex-col gap-2"
    >
      <UTextarea
        v-model="state.description"
        placeholder="A brief description of where this link leads to"
        :disabled="submitting"
        :rows="3"
        class="w-full"
      />
    </UFormField>

    <USeparator />

    <UFormField
      name="status"
      label="Status"
      description="Control whether this link is active"
      required
      class="flex max-sm:flex-col justify-between items-start gap-4"
    >
      <USelect
        v-model="state.status"
        :items="[
          { label: 'Active', value: 'active' },
          { label: 'Inactive', value: 'inactive' },
          { label: 'Expired', value: 'expired' },
        ]"
        :disabled="submitting"
        class="w-full sm:max-w-xs"
      />
    </UFormField>

    <USeparator />

    <UFormField
      name="expiresAt"
      label="Expiration Date"
      description="Optionally set when this link should expire (optional)."
      class="flex max-sm:flex-col justify-between items-start gap-4"
    >
      <UInput
        v-model="state.expiresAt"
        type="datetime-local"
        :disabled="submitting"
        class="w-full sm:max-w-xs"
      />
    </UFormField>
  </UPageCard>
</template>

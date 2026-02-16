<script setup lang="ts">
import * as z from "zod";
import type { FormSubmitEvent } from "@nuxt/ui";

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
</script>

<template>
  <UFormField
    name="name"
    label="Organization Name"
    description="The display name for your organization."
    required
    class="flex max-sm:flex-col justify-between items-start gap-4"
  >
    <UInput
      v-model="state.name"
      placeholder="Acme Corp"
      autocomplete="off"
      :disabled="submitting"
    />
  </UFormField>

  <USeparator />

  <UFormField
    name="slug"
    label="Slug"
    description="Unique identifier used in URLs and API calls."
    required
    class="flex max-sm:flex-col justify-between items-start gap-4"
  >
    <UInput
      v-model="state.slug"
      placeholder="acme-corp"
      autocomplete="off"
      :disabled="submitting"
    />
  </UFormField>

  <USeparator />

  <UFormField
    name="logo"
    label="Logo URL"
    description="Organization logo image URL."
    class="flex max-sm:flex-col justify-between items-start gap-4"
  >
    <UInput
      v-model="state.logo"
      type="url"
      placeholder="https://example.com/logo.png"
      autocomplete="off"
      :disabled="submitting"
    />
  </UFormField>
</template>

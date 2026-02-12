<script setup lang="ts">
import * as z from "zod";
import type { FormSubmitEvent } from "@nuxt/ui";

definePageMeta({
  layout: "dashboard",
  title: "Create Link - Dashboard - JumpStats",
});

const toast = useToast();
const { $authClient } = useNuxtApp();

const schema = z.object({
  originalUrl: z.string().url("Please enter a valid URL"),
  title: z.string().max(200).optional(),
  description: z.string().max(500).optional(),
  expiresAt: z.string().optional(),
});

type Schema = z.output<typeof schema>;

const state = reactive<Schema>({
  originalUrl: "",
  title: "",
  description: "",
  expiresAt: "",
});

const submitting = ref(false);

async function createLink(event: FormSubmitEvent<Schema>) {
  submitting.value = true;
  try {
    const result = await $authClient.link.create({
      originalUrl: event.data.originalUrl,
      title: event.data.title || null,
      description: event.data.description || null,
      expiresAt: event.data.expiresAt ? new Date(event.data.expiresAt) : null,
    });

    if (result.error) {
      toast.add({
        title: "Error",
        description: result.error.message || "Failed to create link",
        color: "error",
      });
      return;
    }

    toast.add({
      title: "Success",
      description: "Link created successfully",
      color: "success",
    });

    await navigateTo("/dashboard/links");
  } catch (error) {
    toast.add({
      title: "Error",
      description: "An unexpected error occurred",
      color: "error",
    });
  } finally {
    submitting.value = false;
  }
}
</script>

<template>
  <UDashboardPanel id="create-link">
    <template #header>
      <UDashboardNavbar title="Create Link">
        <template #leading>
          <UDashboardSidebarCollapse />
        </template>
      </UDashboardNavbar>
    </template>

    <template #body>
      <div class="flex flex-col gap-4 sm:gap-6 lg:gap-12 w-full lg:max-w-2xl mx-auto">
        <UForm id="create-link" :schema="schema" :state="state" @submit="createLink">
          <UPageCard
            title="Create Short Link"
            description="Create a new short link to track and manage your URLs."
            variant="naked"
            orientation="horizontal"
            class="mb-4"
          >
            <div class="flex gap-3 ms-auto">
              <UButton variant="outline" to="/dashboard/links" :disabled="submitting">
                Cancel
              </UButton>
              <UButton
                form="create-link"
                label="Create Link"
                color="primary"
                type="submit"
                :loading="submitting"
              >
                <template #leading>
                  <UIcon name="i-lucide-plus" />
                </template>
              </UButton>
            </div>
          </UPageCard>

          <UPageCard variant="subtle">
            <UFormField
              name="originalUrl"
              label="Destination URL"
              description="The full URL you want to shorten (e.g., https://example.com/very-long-url)."
              required
              class="flex max-sm:flex-col justify-between items-start gap-4"
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
              name="title"
              label="Title"
              description="A descriptive title for your link (optional)."
              class="flex max-sm:flex-col justify-between items-start gap-4"
            >
              <UInput
                v-model="state.title"
                placeholder="My Awesome Link"
                :disabled="submitting"
                class="w-full"
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
        </UForm>
      </div>
    </template>
  </UDashboardPanel>
</template>

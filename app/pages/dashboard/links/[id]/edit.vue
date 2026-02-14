<script setup lang="ts">
import * as z from "zod";
import type { FormSubmitEvent } from "@nuxt/ui";
import { authClient } from "~/utils/auth";

const route = useRoute();
const linkId = route.params.id as string;

const { link, loading, error, fetchLink } = useLinkDetail(linkId);

const toast = useToast();

const schema = z.object({
  originalUrl: z.string().url("Please enter a valid URL"),
  title: z.string().max(200).nullable().optional(),
  description: z.string().max(500).nullable().optional(),
  status: z.enum(["active", "inactive", "expired"]).optional(),
});

type Schema = z.output<typeof schema>;

const state = reactive<Schema>({
  originalUrl: "",
  title: "",
  description: "",
  status: "active",
});

watch(
  () => link.value,
  (newLink) => {
    if (newLink) {
      state.originalUrl = newLink.originalUrl;
      state.title = newLink.title;
      state.description = newLink.description;
      state.status = newLink.status;
    }
  },
);

const submitting = ref(false);

async function updateLink(event: FormSubmitEvent<Schema>) {
  submitting.value = true;
  try {
    const result = await authClient.link.update({
      linkId,
      originalUrl: event.data.originalUrl,
      title: event.data.title || null,
      description: event.data.description || null,
      status: event.data.status,
    });

    if (result.error) {
      toast.add({
        title: "Error",
        description: result.error.message || "Failed to update link",
        color: "error",
      });
      return;
    }

    toast.add({
      title: "Success",
      description: "Link updated successfully",
      color: "success",
    });

    await fetchLink();
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
  <div v-if="link" class="w-full lg:max-w-2xl mx-auto">
    <UForm id="edit-link" :schema="schema" :state="state" @submit="updateLink">
      <UPageCard
        title="Edit Link"
        description="Update link details and settings"
        variant="naked"
        orientation="horizontal"
        class="mb-4"
      >
        <div class="flex gap-3 ms-auto">
          <UButton variant="outline" :to="`/dashboard/links/${linkId}`" :disabled="submitting">
            Cancel
          </UButton>
          <UButton
            form="edit-link"
            label="Save Changes"
            color="primary"
            type="submit"
            :loading="submitting"
          >
            <template #leading>
              <UIcon name="i-lucide-save" />
            </template>
          </UButton>
        </div>
      </UPageCard>

      <UPageCard variant="subtle">
        <UFormField
          name="originalUrl"
          label="Destination URL"
          description="The URL this link points to"
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
          description="A descriptive title for the link"
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
          description="Additional details about this link"
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
      </UPageCard>
    </UForm>
  </div>
</template>

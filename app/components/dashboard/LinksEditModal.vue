<script setup lang="ts">
import * as z from "zod";
import type { Link } from "~~/shared/types/link";

const props = defineProps<{
  link: Link | null;
}>();

const emit = defineEmits<{
  refresh: [];
}>();

const toast = useToast();
const { $authClient } = useNuxtApp();

const open = ref(false);
const loading = ref(false);

const schema = z.object({
  originalUrl: z.string().url("Please enter a valid URL"),
  title: z.string().max(200).nullable().optional(),
  description: z.string().max(500).nullable().optional(),
  status: z.enum(["active", "inactive", "expired"]).optional(),
});

type Schema = z.output<typeof schema>;

const state = reactive<Partial<Schema>>({
  originalUrl: props.link?.originalUrl,
  title: props.link?.title,
  description: props.link?.description,
  status: props.link?.status,
});

watch(
  () => props.link,
  (newLink) => {
    if (newLink) {
      state.originalUrl = newLink.originalUrl;
      state.title = newLink.title;
      state.description = newLink.description;
      state.status = newLink.status;
    }
  },
);

async function updateLink() {
  if (!props.link?.id) {
    toast.add({
      title: "Error",
      description: "Link ID is required",
      color: "error",
    });
    return;
  }

  loading.value = true;
  try {
    const result = await $authClient.link.update({
      linkId: props.link.id,
      originalUrl: state.originalUrl!,
      title: state.title || null,
      description: state.description || null,
      status: state.status,
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

    emit("refresh");
    open.value = false;
  } catch (error) {
    toast.add({
      title: "Error",
      description: "An unexpected error occurred",
      color: "error",
    });
  } finally {
    loading.value = false;
  }
}
</script>

<template>
  <UModal v-model:open="open" title="Edit Link">
    <template #body>
      <div class="space-y-4">
        <UForm :schema="schema" :state="state" class="space-y-4" @submit="updateLink">
          <UFormField
            name="originalUrl"
            label="Destination URL"
            description="The URL this link points to"
          >
            <UInput
              v-model="state.originalUrl"
              placeholder="https://example.com/very-long-url"
              :disabled="loading"
              class="w-full"
            />
          </UFormField>

          <UFormField name="title" label="Title">
            <UInput
              v-model="state.title"
              placeholder="My Awesome Link"
              :disabled="loading"
              class="w-full"
            />
          </UFormField>

          <UFormField name="description" label="Description">
            <UTextarea
              v-model="state.description"
              placeholder="A brief description of this link"
              :disabled="loading"
              class="w-full"
              :rows="3"
            />
          </UFormField>

          <UFormField name="status" label="Status">
            <USelect
              v-model="state.status"
              :items="[
                { label: 'Active', value: 'active' },
                { label: 'Inactive', value: 'inactive' },
                { label: 'Expired', value: 'expired' },
              ]"
              :disabled="loading"
              class="w-full"
            />
          </UFormField>

          <div class="flex justify-end gap-2">
            <UButton variant="outline" @click="open = false" :disabled="loading"> Cancel </UButton>
            <UButton type="submit" :loading="loading"> Save Changes </UButton>
          </div>
        </UForm>
      </div>
    </template>
  </UModal>
</template>

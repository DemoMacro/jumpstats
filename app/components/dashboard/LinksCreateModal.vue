<script setup lang="ts">
import * as z from "zod";
import type { CreateLink } from "~~/shared/types/link";

const emit = defineEmits<{
  refresh: [];
}>();

const toast = useToast();
const { $authClient } = useNuxtApp();

const open = ref(false);
const loading = ref(false);

const schema = z.object({
  originalUrl: z.string().url("Please enter a valid URL"),
  title: z.string().max(200).optional(),
  description: z.string().max(500).optional(),
});

type Schema = z.output<typeof schema>;

const state = reactive<Partial<Schema>>({
  originalUrl: undefined,
  title: undefined,
  description: undefined,
});

async function createLink() {
  loading.value = true;
  try {
    const result = await $authClient.link.create({
      originalUrl: state.originalUrl!,
      title: state.title || null,
      description: state.description || null,
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

    emit("refresh");
    open.value = false;

    state.originalUrl = undefined;
    state.title = undefined;
    state.description = undefined;
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
  <UModal v-model:open="open" title="Create Link">
    <template #trigger>
      <UButton icon="i-lucide-plus" label="Create Link" />
    </template>

    <template #body>
      <div class="space-y-4">
        <p class="text-sm text-muted-foreground">
          Create a new short link to track and manage your URLs.
        </p>

        <UForm :schema="schema" :state="state" class="space-y-4" @submit="createLink">
          <UFormField
            name="originalUrl"
            label="Destination URL"
            description="The URL you want to shorten"
          >
            <UInput
              v-model="state.originalUrl"
              placeholder="https://example.com/very-long-url"
              :disabled="loading"
              class="w-full"
            />
          </UFormField>

          <UFormField name="title" label="Title" description="Optional title for the link">
            <UInput
              v-model="state.title"
              placeholder="My Awesome Link"
              :disabled="loading"
              class="w-full"
            />
          </UFormField>

          <UFormField name="description" label="Description" description="Optional description">
            <UTextarea
              v-model="state.description"
              placeholder="A brief description of this link"
              :disabled="loading"
              class="w-full"
              :rows="3"
            />
          </UFormField>

          <div class="flex justify-end gap-2">
            <UButton variant="outline" @click="open = false" :disabled="loading"> Cancel </UButton>
            <UButton type="submit" :loading="loading" :disabled="!state.originalUrl">
              Create Link
            </UButton>
          </div>
        </UForm>
      </div>
    </template>
  </UModal>
</template>

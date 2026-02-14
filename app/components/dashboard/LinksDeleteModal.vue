<script setup lang="ts">
import type { Link } from "~~/shared/types/link";
import * as z from "zod";
import { authClient } from "~/utils/auth";

const props = defineProps<{
  link: Link | null;
}>();

const emit = defineEmits<{
  refresh: [];
}>();

const toast = useToast();

const open = ref(false);
const loading = ref(false);

const schema = z.object({
  confirmText: z.string().refine((val) => val === props.link?.shortCode, {
    message: "Please enter the short code to confirm deletion",
  }),
});

type Schema = z.output<typeof schema>;

const state = reactive<Partial<Schema>>({
  confirmText: "",
});

async function deleteLink() {
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
    const result = await authClient.link.delete({
      linkId: props.link.id,
    });

    if (result.error) {
      toast.add({
        title: "Error",
        description: result.error.message || "Failed to delete link",
        color: "error",
      });
      return;
    }

    toast.add({
      title: "Success",
      description: `Link ${props.link.shortCode} has been deleted`,
      color: "success",
    });

    emit("refresh");
    open.value = false;
    state.confirmText = "";
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
  <UModal v-model:open="open" title="Delete Link" description="This action cannot be undone">
    <slot />

    <template #body>
      <div class="space-y-4">
        <p class="text-muted-foreground">
          Are you sure you want to delete the link
          <span class="font-mono font-semibold">{{ link?.shortCode }}</span
          >? This action cannot be undone.
        </p>

        <UForm :schema="schema" :state="state" class="space-y-4" @submit="deleteLink">
          <UFormField
            name="confirmText"
            :label="`Type '${link?.shortCode}' to confirm`"
            description="Please enter the short code to confirm deletion"
          >
            <UInput
              v-model="state.confirmText"
              :placeholder="link?.shortCode"
              :disabled="loading"
              class="w-full"
            />
          </UFormField>

          <div class="flex justify-end gap-2">
            <UButton variant="outline" @click="open = false" :disabled="loading"> Cancel </UButton>
            <UButton
              color="error"
              type="submit"
              :loading="loading"
              :disabled="state.confirmText !== link?.shortCode"
            >
              Delete Link
            </UButton>
          </div>
        </UForm>
      </div>
    </template>
  </UModal>
</template>

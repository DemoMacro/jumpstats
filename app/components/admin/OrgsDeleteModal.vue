<script setup lang="ts">
import type { Organization } from "better-auth/plugins";
import * as z from "zod";
import type { FormSubmitEvent } from "@nuxt/ui";

const props = defineProps<{
  organization: Organization | null;
}>();

const toast = useToast();
const { $authClient } = useNuxtApp();

const open = ref(false);
const loading = ref(false);

const emit = defineEmits<{
  refresh: [];
}>();

// Form schema
const schema = z.object({
  confirmText: z.string().refine((val) => val === props.organization?.name, {
    message: "Please enter the exact organization name to confirm deletion",
  }),
});

type Schema = z.output<typeof schema>;

const state = reactive<Partial<Schema>>({
  confirmText: undefined,
});

// Delete organization using Better-Auth organization plugin
async function deleteOrganization() {
  if (!props.organization?.id) {
    toast.add({
      title: "Error",
      description: "Organization ID is required for deletion",
      color: "error",
    });
    return;
  }

  loading.value = true;
  try {
    const result = await $authClient.organization.delete({
      organizationId: props.organization.id,
    });

    if (result.error) {
      toast.add({
        title: "Error",
        description: result.error.message || "Failed to delete organization",
        color: "error",
      });
      return;
    }

    toast.add({
      title: "Success",
      description: `Organization ${props.organization.name} has been deleted successfully`,
      color: "success",
    });

    emit("refresh");
    open.value = false;

    // Reset form
    state.confirmText = "";
  } catch (error) {
    toast.add({
      title: "Error",
      description: "An unexpected error occurred while deleting organization",
      color: "error",
    });
  } finally {
    loading.value = false;
  }
}
</script>

<template>
  <UModal
    v-model:open="open"
    title="Delete Organization"
    description="Confirm the permanent deletion of this organization"
  >
    <slot />

    <template #body>
      <div class="space-y-4">
        <p class="text-muted-foreground">
          This action cannot be undone. This will permanently delete the organization and remove all
          organization data, members, and settings.
        </p>

        <UForm :schema="schema" :state="state" class="space-y-4" @submit="deleteOrganization">
          <UFormField
            name="confirmText"
            :label="`Type '${props.organization?.name}' to confirm deletion`"
            description="Please enter the exact organization name to confirm you want to delete this organization"
          >
            <UInput
              v-model="state.confirmText"
              :placeholder="props.organization?.name"
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
              :disabled="state.confirmText !== props.organization?.name"
            >
              Delete Organization
            </UButton>
          </div>
        </UForm>
      </div>
    </template>
  </UModal>
</template>

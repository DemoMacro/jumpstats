<script setup lang="ts">
import type { UserWithRole } from "better-auth/plugins";
import * as z from "zod";

const props = defineProps<{
  user: UserWithRole | null;
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
  confirmText: z.string().refine((val) => val === props.user?.email || val === props.user?.name, {
    message: "Please enter the exact email or name to confirm deletion",
  }),
});

type Schema = z.output<typeof schema>;

const state = reactive<Partial<Schema>>({
  confirmText: "",
});

// Delete user using Better-Auth admin plugin
async function deleteUser() {
  if (!props.user?.id) {
    toast.add({
      title: "Error",
      description: "User ID is required for deletion",
      color: "error",
    });
    return;
  }

  loading.value = true;
  try {
    const result = await $authClient.admin.removeUser({
      userId: props.user.id,
    });

    if (result.error) {
      toast.add({
        title: "Error",
        description: result.error.message || "Failed to delete user",
        color: "error",
      });
      return;
    }

    toast.add({
      title: "Success",
      description: `User ${props.user.email} has been deleted successfully`,
      color: "success",
    });

    emit("refresh");
    open.value = false;

    // Reset form
    state.confirmText = "";
  } catch (error) {
    toast.add({
      title: "Error",
      description: "An unexpected error occurred while deleting user",
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
    title="Delete User"
    description="Confirm the permanent deletion of this user account"
  >
    <slot />

    <template #body>
      <div class="space-y-4">
        <p class="text-muted-foreground">
          This action cannot be undone. This will permanently delete the user account and remove all
          their data.
        </p>

        <UForm :schema="schema" :state="state" class="space-y-4" @submit="deleteUser">
          <UFormField
            name="confirmText"
            :label="`Type '${props.user?.email || props.user?.name}' to confirm deletion`"
            description="Please enter the exact email or name to confirm you want to delete this user"
          >
            <UInput
              v-model="state.confirmText"
              :placeholder="props.user?.email || props.user?.name"
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
              :disabled="state.confirmText !== (props.user?.email || props.user?.name)"
            >
              Delete User
            </UButton>
          </div>
        </UForm>
      </div>
    </template>
  </UModal>
</template>

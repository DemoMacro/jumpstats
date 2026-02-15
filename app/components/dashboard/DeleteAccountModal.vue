<script setup lang="ts">
import * as z from "zod";
import { authClient } from "~/utils/auth";

const emit = defineEmits<{
  success: [];
}>();

const toast = useToast();

const open = ref(false);
const loading = ref(false);

const schema = z.object({
  password: z.string().min(1, "Password is required"),
});

type Schema = z.output<typeof schema>;

const state = reactive<Partial<Schema>>({
  password: "",
});

async function deleteAccount() {
  loading.value = true;
  try {
    const { error } = await authClient.deleteUser({
      password: state.password,
    });

    if (error) {
      toast.add({
        title: "Error",
        description: error.message || "Failed to delete account",
        color: "error",
      });
      return;
    }

    toast.add({
      title: "Success",
      description: "Your account has been deleted",
      color: "success",
    });

    emit("success");
    open.value = false;
    state.password = "";

    // Redirect to home page
    await navigateTo("/");
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
  <UModal v-model:open="open" title="Delete Account" description="This action cannot be undone">
    <slot />

    <template #body>
      <div class="space-y-4">
        <UAlert
          icon="i-lucide-alert-triangle"
          color="error"
          variant="subtle"
          title="Warning"
          description="This will permanently delete your account and all associated data."
        />

        <UForm :schema="schema" :state="state" class="space-y-4" @submit="deleteAccount">
          <UFormField
            name="password"
            label="Password"
            description="Enter your password to confirm deletion"
          >
            <UInput
              v-model="state.password"
              type="password"
              placeholder="Enter your password"
              autocomplete="current-password"
              :disabled="loading"
              class="w-full"
            />
          </UFormField>

          <div class="flex justify-end gap-2">
            <UButton variant="outline" @click="open = false" :disabled="loading"> Cancel </UButton>
            <UButton color="error" type="submit" :loading="loading" :disabled="!state.password">
              Delete Account
            </UButton>
          </div>
        </UForm>
      </div>
    </template>
  </UModal>
</template>

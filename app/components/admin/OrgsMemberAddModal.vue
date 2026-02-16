<script setup lang="ts">
import type { Organization } from "better-auth/plugins";
import * as z from "zod";
import type { FormSubmitEvent } from "@nuxt/ui";
import { authClient } from "~/utils/auth";

const props = defineProps<{
  organization: Organization | null | undefined;
}>();

const toast = useToast();

const open = ref(false);
const loading = ref(false);

const emit = defineEmits<{
  refresh: [];
}>();

// Form schema
const schema = z.object({
  email: z.string().email("Invalid email"),
  role: z.enum(["owner", "admin", "member"]).refine((val) => val !== undefined, {
    message: "Please select a role",
  }),
});

type Schema = z.output<typeof schema>;

const state = reactive<Partial<Schema>>({
  email: undefined,
  role: "member",
});

async function onSubmit(event: FormSubmitEvent<Schema>) {
  if (!props.organization?.id) {
    toast.add({
      title: "Error",
      description: "Organization ID is required",
      color: "error",
    });
    return;
  }

  loading.value = true;
  try {
    const result = await authClient.organization.inviteMember({
      email: event.data.email,
      role: event.data.role,
      organizationId: props.organization.id,
    });

    if (result.error) {
      toast.add({
        title: "Error",
        description: result.error.message || "Failed to add member",
        color: "error",
      });
      return;
    }

    toast.add({
      title: "Success",
      description: `Member ${event.data.email} has been invited successfully`,
      color: "success",
    });

    emit("refresh");
    open.value = false;

    // Reset form
    state.email = undefined;
    state.role = "member";
  } catch (error) {
    toast.add({
      title: "Error",
      description: "An unexpected error occurred while adding member",
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
    title="Add Organization Member"
    description="Invite a new member by email address."
  >
    <slot />

    <template #body>
      <UForm :schema="schema" :state="state" class="space-y-4" @submit="onSubmit">
        <UFormField
          label="Email Address"
          name="email"
          description="The email address of the user to add"
        >
          <UInput
            v-model="state.email"
            type="email"
            placeholder="user@example.com"
            :disabled="loading"
            class="w-full"
          />
        </UFormField>

        <UFormField label="Role" name="role" description="Select the role for this member">
          <USelect
            v-model="state.role"
            :items="[
              { label: 'Member', value: 'member' },
              { label: 'Admin', value: 'admin' },
              { label: 'Owner', value: 'owner' },
            ]"
            :disabled="loading"
            class="w-full"
          />
        </UFormField>

        <div class="flex justify-end gap-2">
          <UButton
            label="Cancel"
            color="neutral"
            variant="outline"
            @click="open = false"
            :disabled="loading"
          />
          <UButton
            label="Add Member"
            color="primary"
            type="submit"
            :loading="loading"
            :disabled="!state.email"
          />
        </div>
      </UForm>
    </template>
  </UModal>
</template>

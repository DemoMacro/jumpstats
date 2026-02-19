<script setup lang="ts">
import type { Domain } from "~~/shared/types/domain";
import * as z from "zod";
import { authClient } from "~/utils/auth";

const props = defineProps<{
  domain: Domain | null;
}>();

const emit = defineEmits<{
  refresh: [];
}>();

const toast = useToast();

const open = ref(false);
const loading = ref(false);

const schema = z.object({
  confirmText: z.string().refine((val) => val === props.domain?.domainName, {
    message: "Please enter domain name to confirm deletion",
  }),
});

type Schema = z.output<typeof schema>;

const state = reactive<Partial<Schema>>({
  confirmText: "",
});

async function deleteDomain() {
  if (!props.domain?.id) {
    toast.add({
      title: "Error",
      description: "Domain ID is required",
      color: "error",
    });
    return;
  }

  loading.value = true;
  try {
    const result = await authClient.domain.delete({
      domainId: props.domain.id,
    });

    if (result.error) {
      toast.add({
        title: "Error",
        description: result.error.message || "Failed to delete domain",
        color: "error",
      });
      return;
    }

    toast.add({
      title: "Success",
      description: `Domain ${props.domain.domainName} has been deleted`,
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
  <UModal v-model:open="open" title="Delete Domain" description="This action cannot be undone">
    <slot />

    <template #body>
      <div class="space-y-4">
        <UAlert v-if="domain" color="error" icon="i-lucide-alert-triangle" title="Warning">
          <template #description>
            <div class="space-y-1">
              <p>You are about to delete the domain:</p>
              <p class="font-mono text-sm font-semibold">{{ domain.domainName }}</p>
              <p class="text-xs">
                This action cannot be undone. All links associated with this domain will need to be
                reassigned before deletion.
              </p>
            </div>
          </template>
        </UAlert>

        <UForm :schema="schema" :state="state" class="space-y-4" @submit="deleteDomain">
          <UFormField
            name="confirmText"
            :label="`Type '${domain?.domainName}' to confirm`"
            description="Please enter the domain name to confirm deletion"
          >
            <UInput
              v-model="state.confirmText"
              :placeholder="domain?.domainName"
              :disabled="loading"
              class="w-full font-mono"
            />
          </UFormField>

          <div class="flex justify-end gap-2">
            <UButton variant="outline" @click="open = false" :disabled="loading"> Cancel </UButton>
            <UButton
              color="error"
              type="submit"
              :loading="loading"
              :disabled="state.confirmText !== domain?.domainName"
            >
              <template #leading>
                <UIcon name="i-lucide-trash" />
              </template>
              Delete Domain
            </UButton>
          </div>
        </UForm>
      </div>
    </template>
  </UModal>
</template>

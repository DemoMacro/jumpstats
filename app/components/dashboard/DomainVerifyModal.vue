<script setup lang="ts">
import type { Domain } from "~~/shared/types/domain";
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

const { copy, copied, isSupported } = useClipboard();

// Watch copied state and show toast notification
watch(copied, (isCopied) => {
  if (isCopied) {
    toast.add({
      title: "Success",
      description: "Verification token copied to clipboard",
      color: "success",
    });
  }
});

async function copyToken(token: string) {
  if (!isSupported.value) {
    toast.add({
      title: "Error",
      description: "Clipboard not supported in this browser",
      color: "error",
    });
    return;
  }

  await copy(token);
}

async function verifyDomain() {
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
    const result = await authClient.domain.verify({
      domainId: props.domain.id,
    });

    if (result.error) {
      toast.add({
        title: "Verification Failed",
        description:
          result.error.message || "Failed to verify domain. Please check your DNS configuration.",
        color: "error",
      });
      return;
    }

    toast.add({
      title: "Success",
      description: `Domain ${props.domain.domainName} has been verified successfully!`,
      color: "success",
    });

    emit("refresh");
    open.value = false;
  } catch (error) {
    toast.add({
      title: "Error",
      description: "An unexpected error occurred during verification",
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
    title="Verify Domain Ownership"
    description="Verify that you own this domain via DNS TXT record"
  >
    <slot />

    <template #body>
      <div class="space-y-4">
        <UAlert
          v-if="domain"
          color="neutral"
          icon="i-lucide-info"
          title="DNS TXT Record Configuration"
          description="Add the following TXT record to your domain's DNS configuration:"
        >
          <template #body>
            <div class="mt-4 space-y-3">
              <div class="flex items-start gap-3">
                <span class="text-sm font-medium min-w-16">Type:</span>
                <UBadge variant="subtle">TXT</UBadge>
              </div>
              <div class="flex items-start gap-3">
                <span class="text-sm font-medium min-w-16">Host/Name:</span>
                <span class="text-sm font-mono">@</span>
                <span class="text-xs text-muted-foreground">(or {{ domain.domainName }})</span>
              </div>
              <div class="flex items-start gap-3">
                <span class="text-sm font-medium min-w-16">Value:</span>
                <div class="flex items-center gap-2 flex-1">
                  <span class="text-sm font-mono break-all">
                    {{ domain.verificationToken }}
                  </span>
                  <UButton
                    variant="ghost"
                    size="xs"
                    icon="i-lucide-copy"
                    @click="copyToken(domain.verificationToken || '')"
                  />
                </div>
              </div>
            </div>
          </template>
        </UAlert>

        <div class="flex justify-end gap-2">
          <UButton variant="outline" @click="open = false" :disabled="loading"> Cancel </UButton>
          <UButton color="primary" :loading="loading" @click="verifyDomain">
            <template #leading>
              <UIcon name="i-lucide-check" />
            </template>
            Verify Domain
          </UButton>
        </div>
      </div>
    </template>
  </UModal>
</template>

<script setup lang="ts">
import * as z from "zod";
import type { FormSubmitEvent } from "@nuxt/ui";
import { authClient } from "~/utils/auth";

definePageMeta({
  layout: "dashboard",
  title: "Create API Key - Dashboard - JS.GS",
});

const toast = useToast();
const { copy, copied } = useClipboard();

const schema = z.object({
  name: z.string().min(1, "API Key name is required"),
  expiresIn: z.number().min(3600, "Minimum 1 hour").max(31536000, "Maximum 1 year"),
});

type Schema = z.output<typeof schema>;

const state = reactive<Schema>({
  name: "",
  expiresIn: 60 * 60 * 24 * 30, // 30 days default
});

const submitting = ref(false);
const createdKey = ref<{ key: string; name: string } | null>(null);

async function createApiKey(event: FormSubmitEvent<Schema>) {
  submitting.value = true;
  try {
    const result = await authClient.apiKey.create({
      name: event.data.name,
      expiresIn: event.data.expiresIn,
    });

    if (result.error) {
      toast.add({
        title: "Error",
        description: result.error.message || "Failed to create API key",
        color: "error",
      });
      return;
    }

    // Show the API key for copying
    createdKey.value = {
      key: result.data.key,
      name: event.data.name,
    };

    toast.add({
      title: "Success",
      description: `API Key "${event.data.name}" has been created successfully`,
      color: "success",
    });
  } catch (error) {
    toast.add({
      title: "Error",
      description: error instanceof Error ? error.message : "An unexpected error occurred",
      color: "error",
    });
  } finally {
    submitting.value = false;
  }
}

function goToKeys() {
  createdKey.value = null;
  state.name = "";
  navigateTo("/dashboard/apikeys");
}

// Watch copied state and show toast notification
watch(copied, (isCopied) => {
  if (isCopied) {
    toast.add({
      title: "Success",
      description: "API Key copied to clipboard",
      color: "success",
    });
  }
});
</script>

<template>
  <UDashboardPanel id="create-api-key">
    <template #header>
      <UDashboardNavbar title="Create API Key">
        <template #leading>
          <UDashboardSidebarCollapse />
        </template>
      </UDashboardNavbar>
    </template>

    <template #body>
      <div class="w-full lg:max-w-2xl mx-auto">
        <!-- Show API Key after successful creation -->
        <div v-if="createdKey" class="space-y-4">
          <UPageCard
            title="API Key Created Successfully"
            description="Copy your API key now. You won't be able to see it again!"
            variant="subtle"
          >
            <div class="space-y-4">
              <div>
                <label class="text-sm font-medium mb-2 block">Your API Key</label>
                <div class="flex gap-2">
                  <UInput
                    :value="createdKey.key"
                    readonly
                    class="flex-1 font-mono text-sm"
                    color="neutral"
                  />
                  <UButton
                    icon="i-lucide-copy"
                    :color="copied ? 'success' : 'neutral'"
                    variant="outline"
                    @click="copy(createdKey.key)"
                  >
                    {{ copied ? "Copied!" : "Copy" }}
                  </UButton>
                </div>
              </div>

              <UAlert
                icon="i-lucide-alert-triangle"
                color="warning"
                title="Save this API key securely"
                description="For security reasons, we won't be able to show it to you again. Make sure to save it in a secure location."
              />

              <div class="flex gap-3 pt-4">
                <UButton
                  variant="outline"
                  @click="
                    createdKey = null;
                    state.name = '';
                  "
                >
                  Create Another
                </UButton>
                <UButton @click="goToKeys"> Go to API Keys </UButton>
              </div>
            </div>
          </UPageCard>
        </div>

        <!-- Creation form -->
        <UForm v-else id="create-api-key" :schema="schema" :state="state" @submit="createApiKey">
          <UPageCard
            title="Create API Key"
            description="Create a new API key for programmatic access to your account."
            variant="naked"
            orientation="horizontal"
            class="mb-4"
          >
            <div class="flex gap-3 ms-auto">
              <UButton variant="outline" to="/dashboard/apikeys" :disabled="submitting">
                Cancel
              </UButton>
              <UButton label="Create API Key" color="primary" type="submit" :loading="submitting">
                <template #leading>
                  <UIcon name="i-lucide-plus" />
                </template>
              </UButton>
            </div>
          </UPageCard>

          <UPageCard variant="subtle">
            <UFormField
              name="name"
              label="Name"
              description="Give your API key a meaningful name to help you identify it later."
              required
              class="flex max-sm:flex-col justify-between items-start gap-4"
            >
              <UInput
                v-model="state.name"
                placeholder="e.g., Production App"
                :disabled="submitting"
                class="w-full"
              />
            </UFormField>

            <USeparator />

            <UFormField
              name="expiresIn"
              label="Expiration"
              description="Set how long this API key should remain valid. After expiration, it will no longer work."
              required
              class="flex max-sm:flex-col justify-between items-start gap-4"
            >
              <USelect
                v-model="state.expiresIn"
                :items="[
                  { label: '1 hour', value: 3600 },
                  { label: '1 day', value: 86400 },
                  { label: '7 days', value: 604800 },
                  { label: '30 days', value: 2592000 },
                  { label: '90 days', value: 7776000 },
                  { label: '1 year', value: 31536000 },
                ]"
                :disabled="submitting"
                class="w-full sm:max-w-xs"
              />
            </UFormField>

            <USeparator />

            <div>
              <h4 class="font-medium mb-2">Important Notes</h4>
              <ul class="text-sm text-muted-foreground space-y-1">
                <li>• API keys inherit your account permissions automatically</li>
                <li>• You can only view the full API key once immediately after creation</li>
                <li>• Treat API keys like passwords - keep them secure and never share them</li>
                <li>• Delete unused API keys to maintain account security</li>
              </ul>
            </div>
          </UPageCard>
        </UForm>
      </div>
    </template>
  </UDashboardPanel>
</template>

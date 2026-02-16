<script setup lang="ts">
import * as z from "zod";
import type { FormSubmitEvent } from "@nuxt/ui";
import { authClient } from "~/utils/auth";

definePageMeta({
  layout: "dashboard",
  title: "Create Domain - Dashboard - JumpStats",
});

const toast = useToast();

// Get active organization
const activeOrgResult = authClient.useActiveOrganization();
const activeOrg = computed(() => activeOrgResult.value.data);

const schema = z.object({
  domainName: z.string().min(1, "Please enter a domain name"),
  organizationId: z.string().optional(),
});

type Schema = z.output<typeof schema>;

const state = reactive<Schema>({
  domainName: "",
  organizationId: "",
});

const submitting = ref(false);

async function createDomain(event: FormSubmitEvent<Schema>) {
  submitting.value = true;
  try {
    const result = await authClient.domain.create({
      domainName: event.data.domainName,
      organizationId: activeOrg.value?.id || null,
    });

    if (result.error) {
      toast.add({
        title: "Error",
        description: result.error.message || "Failed to create domain",
        color: "error",
      });
      return;
    }

    toast.add({
      title: "Success",
      description: "Domain created successfully. Please verify ownership via DNS.",
      color: "success",
    });

    await navigateTo("/dashboard/domains");
  } catch (error) {
    toast.add({
      title: "Error",
      description: "An unexpected error occurred",
      color: "error",
    });
  } finally {
    submitting.value = false;
  }
}
</script>

<template>
  <UDashboardPanel id="create-domain">
    <template #header>
      <UDashboardNavbar title="Create Domain">
        <template #leading>
          <UDashboardSidebarCollapse />
        </template>
      </UDashboardNavbar>
    </template>

    <template #body>
      <div class="flex flex-col gap-4 sm:gap-6 lg:gap-12 w-full lg:max-w-2xl mx-auto">
        <UForm id="create-domain" :schema="schema" :state="state" @submit="createDomain">
          <UPageCard
            title="Add Custom Domain"
            description="Add a custom domain to use with your short links."
            variant="naked"
            orientation="horizontal"
            class="mb-4"
          >
            <div class="flex gap-3 ms-auto">
              <UButton variant="outline" to="/dashboard/domains" :disabled="submitting">
                Cancel
              </UButton>
              <UButton
                form="create-domain"
                label="Create Domain"
                color="primary"
                type="submit"
                :loading="submitting"
              >
                <template #leading>
                  <UIcon name="i-lucide-plus" />
                </template>
              </UButton>
            </div>
          </UPageCard>

          <UPageCard variant="subtle">
            <UFormField
              name="domainName"
              label="Domain Name"
              description="The domain you want to use (e.g., example.com)."
              required
              class="flex max-sm:flex-col justify-between items-start gap-4"
            >
              <UInput
                v-model="state.domainName"
                placeholder="example.com"
                :disabled="submitting"
                class="w-full"
              />
            </UFormField>

            <USeparator />

            <UFormField
              name="organizationId"
              label="Organization"
              :description="
                activeOrg ? `Creating for: ${activeOrg.name}` : 'Creating as personal domain'
              "
              class="flex max-sm:flex-col justify-between items-start gap-4"
            >
              <UInput :model-value="activeOrg?.name || 'Personal'" disabled class="w-full" />
            </UFormField>

            <USeparator />

            <p class="text-sm font-medium">⚠️ DNS Verification Required</p>
            <p class="text-sm text-muted-foreground">
              After creating this domain, you'll need to verify ownership by adding a TXT record to
              your domain's DNS configuration.
            </p>
          </UPageCard>
        </UForm>
      </div>
    </template>
  </UDashboardPanel>
</template>

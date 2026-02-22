<script setup lang="ts">
import * as z from "zod";
import type { FormSubmitEvent } from "@nuxt/ui";
import { authClient } from "~/utils/auth";

definePageMeta({
  layout: "dashboard",
  title: "Create Link - Dashboard - JS.GS",
});

const toast = useToast();

const schema = z.object({
  organizationId: z.string().optional(),
  originalUrl: z.string().url("Please enter a valid URL"),
  domainId: z.string().optional(),
  title: z.string().max(200).optional(),
  description: z.string().max(500).optional(),
  status: z.enum(["active", "inactive", "expired"]).optional(),
  expiresAt: z.string().optional(),
});

type Schema = z.output<typeof schema>;

const state = reactive<Partial<Schema>>({
  organizationId: "personal",
  originalUrl: undefined,
  domainId: "default",
  title: undefined,
  description: undefined,
  status: "active",
  expiresAt: undefined,
});

const submitting = ref(false);

async function createLink(event: FormSubmitEvent<Schema>) {
  submitting.value = true;
  try {
    const result = await authClient.link.create({
      originalUrl: event.data.originalUrl!,
      domainId: event.data.domainId === "default" ? null : event.data.domainId || null,
      title: event.data.title || null,
      description: event.data.description || null,
      status: event.data.status || "active",
      expiresAt: event.data.expiresAt ? new Date(event.data.expiresAt) : null,
      organizationId:
        event.data.organizationId === "personal" ? undefined : event.data.organizationId,
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

    await navigateTo("/dashboard/links");
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
  <UDashboardPanel id="create-link">
    <template #header>
      <UDashboardNavbar title="Create Link">
        <template #leading>
          <UDashboardSidebarCollapse />
        </template>
      </UDashboardNavbar>
    </template>

    <template #body>
      <div class="w-full lg:max-w-2xl mx-auto">
        <UForm id="create-link" :schema="schema" :state="state" @submit="createLink">
          <UPageCard
            title="Create Short Link"
            description="Create a new short link to track and manage your URLs."
            variant="naked"
            orientation="horizontal"
            class="mb-4"
          >
            <div class="flex gap-3 ms-auto">
              <UButton variant="outline" to="/dashboard/links" :disabled="submitting">
                Cancel
              </UButton>
              <UButton label="Create Link" color="primary" type="submit" :loading="submitting">
                <template #leading>
                  <UIcon name="i-lucide-plus" />
                </template>
              </UButton>
            </div>
          </UPageCard>

          <DashboardLinkForm :schema="schema" :state="state" :submitting="submitting" />
        </UForm>
      </div>
    </template>
  </UDashboardPanel>
</template>

<script setup lang="ts">
import type { NavigationMenuItem } from "@nuxt/ui";

definePageMeta({
  layout: "dashboard",
  title: "Organization - Dashboard - JumpStats",
});

// Get active organization
const activeOrgResult = authClient.useActiveOrganization();
const activeOrg = computed(() => activeOrgResult.value.data);

// Navigation items
const links = computed<NavigationMenuItem[][]>(() => [
  [
    {
      label: "Overview",
      icon: "i-lucide-building",
      to: `/dashboard/org`,
      exact: true,
    },
    {
      label: "Members",
      icon: "i-lucide-users",
      to: `/dashboard/org/members`,
    },
    {
      label: "Security",
      icon: "i-lucide-shield",
      to: `/dashboard/org/security`,
    },
  ],
]);
</script>

<template>
  <UDashboardPanel id="organization-settings" :ui="{ body: 'lg:py-12' }">
    <template #header>
      <UDashboardNavbar :title="`Organization - ${activeOrg?.name || 'Unknown'}`">
        <template #leading>
          <UDashboardSidebarCollapse />
        </template>
      </UDashboardNavbar>

      <UDashboardToolbar>
        <UNavigationMenu :items="links" highlight class="-mx-1 flex-1" />
      </UDashboardToolbar>
    </template>

    <template #body>
      <div v-if="!activeOrg" class="text-center py-8">
        <UIcon name="i-lucide-building" class="size-12 text-muted-foreground mx-auto mb-4" />
        <h3 class="text-lg font-semibold text-muted-foreground mb-2">No Active Organization</h3>
        <p class="text-muted-foreground mb-4">
          Please select an organization from the menu or create a new one.
        </p>
        <UButton to="/dashboard/create-org">
          <template #leading>
            <UIcon name="i-lucide-plus" />
          </template>
          Create Organization
        </UButton>
      </div>

      <div v-else class="flex flex-col gap-4 sm:gap-6 lg:gap-12 w-full lg:max-w-2xl mx-auto">
        <NuxtPage />
      </div>
    </template>
  </UDashboardPanel>
</template>

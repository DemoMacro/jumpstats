<script setup lang="ts">
import type { NavigationMenuItem } from "@nuxt/ui";

definePageMeta({
  layout: "dashboard",
  title: "Organization Details - Admin - JumpStats",
});

const route = useRoute();
const orgId = route.params.id as string;

// Use composable for organization data
const { organization, loading } = useAdminOrg(orgId);

// Navigation items
const links = [
  [
    {
      label: "Overview",
      icon: "i-lucide-building",
      to: `/admin/orgs/${orgId}`,
      exact: true,
    },
    {
      label: "Members",
      icon: "i-lucide-users",
      to: `/admin/orgs/${orgId}/members`,
    },
    {
      label: "Security",
      icon: "i-lucide-shield",
      to: `/admin/orgs/${orgId}/security`,
    },
  ],
] satisfies NavigationMenuItem[][];
</script>

<template>
  <UDashboardPanel id="organization-settings" :ui="{ body: 'lg:py-12' }">
    <template #header>
      <UDashboardNavbar :title="`Organization - ${organization?.name || 'Unknown'}`">
        <template #leading>
          <UDashboardSidebarCollapse />
        </template>
      </UDashboardNavbar>

      <UDashboardToolbar>
        <!-- NOTE: The `-mx-1` class is used to align with the `DashboardSidebarCollapse` button here. -->
        <UNavigationMenu :items="links" highlight class="-mx-1 flex-1" />
      </UDashboardToolbar>
    </template>

    <template #body>
      <div v-if="loading" class="flex items-center justify-center h-64">
        <UIcon name="i-lucide-loader-2" class="animate-spin size-8" />
      </div>

      <div v-else-if="!organization" class="text-center py-8">
        <h3 class="text-lg font-semibold text-muted-foreground mb-2">Organization not found</h3>
        <p class="text-muted-foreground mb-4">
          The organization you're looking for doesn't exist or you don't have permission to view it.
        </p>
        <UButton to="/admin/orgs">Back to Organizations</UButton>
      </div>

      <div v-else class="flex flex-col gap-4 sm:gap-6 lg:gap-12 w-full lg:max-w-2xl mx-auto">
        <NuxtPage />
      </div>
    </template>
  </UDashboardPanel>
</template>

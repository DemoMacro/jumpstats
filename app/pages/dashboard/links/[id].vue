<script setup lang="ts">
import type { NavigationMenuItem } from "@nuxt/ui";

definePageMeta({
  layout: "dashboard",
  title: "Link Details - Dashboard - JumpStats",
});

const route = useRoute();
const linkId = route.params.id as string;

const { link, loading, error, fetchLink } = useLinkDetail(linkId);

// Get analytics composables - they create and manage their own refs
const { range } = useLinkAnalytics(linkId);

const links = computed<NavigationMenuItem[][]>(() => [
  [
    {
      label: "Overview",
      icon: "i-lucide-link",
      to: `/dashboard/links/${linkId}`,
      exact: true,
    },
    {
      label: "Edit",
      icon: "i-lucide-edit",
      to: `/dashboard/links/${linkId}/edit`,
    },
  ],
]);

onMounted(() => {
  fetchLink();
});
</script>

<template>
  <UDashboardPanel id="link-details">
    <template #header>
      <UDashboardNavbar :title="`Link - ${link?.shortCode || 'Unknown'}`">
        <template #leading>
          <UDashboardSidebarCollapse />
        </template>
      </UDashboardNavbar>

      <UDashboardToolbar>
        <template #left>
          <UNavigationMenu :items="links" highlight class="-mx-1 flex-1" />
        </template>

        <template #right>
          <DashboardLinkDateRangePicker v-model="range" />
        </template>
      </UDashboardToolbar>
    </template>

    <template #body>
      <div v-if="loading" class="flex items-center justify-center h-64">
        <UIcon name="i-lucide-loader-2" class="animate-spin size-8" />
      </div>

      <div v-else-if="error" class="text-center py-8">
        <h3 class="text-lg font-semibold text-muted-foreground mb-2">Error</h3>
        <p class="text-muted-foreground mb-4">{{ error }}</p>
        <UButton @click="fetchLink">Retry</UButton>
      </div>

      <div v-else-if="!link" class="text-center py-8">
        <h3 class="text-lg font-semibold text-muted-foreground mb-2">Link not found</h3>
        <p class="text-muted-foreground mb-4">
          The link you're looking for doesn't exist or you don't have permission to view it.
        </p>
        <UButton to="/dashboard/links">Back to Links</UButton>
      </div>

      <div v-else class="flex flex-col gap-4 sm:gap-6 lg:gap-12 w-full mx-auto">
        <NuxtPage :range="range" />
      </div>
    </template>
  </UDashboardPanel>
</template>

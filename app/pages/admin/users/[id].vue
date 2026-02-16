<script setup lang="ts">
import type { NavigationMenuItem } from "@nuxt/ui";

definePageMeta({
  layout: "dashboard",
  title: "User Details - Admin - JumpStats",
});

const route = useRoute();
const userId = route.params.id as string;

// Use composable for user data
const { user, loading } = useAdminUser(userId);

// Navigation items
const links = [
  [
    {
      label: "Overview",
      icon: "i-lucide-user",
      to: `/admin/users/${userId}`,
      exact: true,
    },
    {
      label: "Security",
      icon: "i-lucide-shield",
      to: `/admin/users/${userId}/security`,
    },
  ],
] satisfies NavigationMenuItem[][];
</script>

<template>
  <UDashboardPanel id="user-settings" :ui="{ body: 'lg:py-12' }">
    <template #header>
      <UDashboardNavbar :title="`User - ${user?.name || user?.email || 'Unknown'}`">
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

      <div v-else-if="!user" class="text-center py-8">
        <h3 class="text-lg font-semibold text-muted-foreground mb-2">User not found</h3>
        <p class="text-muted-foreground mb-4">
          The user you're looking for doesn't exist or you don't have permission to view it.
        </p>
        <UButton to="/admin/users">Back to Users</UButton>
      </div>

      <div v-else class="flex flex-col gap-4 sm:gap-6 lg:gap-12 w-full lg:max-w-2xl mx-auto">
        <NuxtPage />
      </div>
    </template>
  </UDashboardPanel>
</template>

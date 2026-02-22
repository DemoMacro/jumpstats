<script setup lang="ts">
import type { NavigationMenuItem } from "@nuxt/ui";

definePageMeta({
  layout: "dashboard",
  title: "Settings - Dashboard - JS.GS",
});

// Navigation items
const links = [
  [
    {
      label: "Profile",
      icon: "i-lucide-user",
      to: "/dashboard/settings",
      exact: true,
    },
    {
      label: "Security",
      icon: "i-lucide-shield",
      to: "/dashboard/settings/security",
    },
    {
      label: "Invitations",
      icon: "i-lucide-mail",
      to: "/dashboard/settings/invitations",
    },
  ],
] satisfies NavigationMenuItem[][];
</script>

<template>
  <UDashboardPanel id="user-settings" :ui="{ body: 'lg:py-12' }">
    <template #header>
      <UDashboardNavbar title="Settings">
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
      <div class="flex flex-col gap-4 sm:gap-6 lg:gap-12 w-full lg:max-w-2xl mx-auto">
        <NuxtPage />
      </div>
    </template>
  </UDashboardPanel>
</template>

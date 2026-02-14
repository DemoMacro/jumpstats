<script setup lang="ts">
import type { DropdownMenuItem } from "@nuxt/ui";

definePageMeta({
  title: "Dashboard - JumpStats",
});

const items = computed(
  () =>
    [
      [
        {
          label: "Create Link",
          icon: "i-lucide-plus",
          onSelect: () => navigateTo("/dashboard/links/create"),
        },
      ],
    ] satisfies DropdownMenuItem[][],
);
</script>

<template>
  <UDashboardPanel id="dashboard-index">
    <template #header>
      <UDashboardNavbar title="Dashboard" :ui="{ right: 'gap-3' }">
        <template #leading>
          <UDashboardSidebarCollapse />
        </template>

        <template #right>
          <UDropdownMenu :items="items">
            <UButton icon="i-lucide-plus" size="md" class="rounded-full" />
          </UDropdownMenu>
        </template>
      </UDashboardNavbar>

      <UDashboardToolbar>
        <template #left>
          <div class="text-sm text-muted-foreground">Overview</div>
        </template>
      </UDashboardToolbar>
    </template>

    <template #body>
      <UPageCard>
        <template #header>
          <h3 class="text-lg font-semibold">Quick Actions</h3>
          <p class="text-sm text-muted-foreground">Common link management tasks</p>
        </template>

        <UPageGrid class="sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <UButton to="/dashboard/links" variant="outline" class="justify-start">
            <UIcon name="i-lucide-list" class="mr-2" />
            View All Links
          </UButton>

          <UButton to="/dashboard/links/create" variant="outline" class="justify-start">
            <UIcon name="i-lucide-plus" class="mr-2" />
            Create Link
          </UButton>

          <UButton variant="outline" class="justify-start" disabled title="Coming soon">
            <UIcon name="i-lucide-settings" class="mr-2" />
            Settings
          </UButton>
        </UPageGrid>
      </UPageCard>

      <UPageCard>
        <template #header>
          <h3 class="text-lg font-semibold">Recent Links</h3>
          <p class="text-sm text-muted-foreground">Your most recently created links</p>
        </template>

        <div class="text-muted-foreground text-center py-8">
          <UIcon name="i-lucide-link" class="size-12 mx-auto mb-4 opacity-50" />
          <p>No links yet.</p>
          <p class="text-sm">Create your first short link to get started!</p>
        </div>
      </UPageCard>
    </template>
  </UDashboardPanel>
</template>

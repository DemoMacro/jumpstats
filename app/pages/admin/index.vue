<script setup lang="ts">
import type { DropdownMenuItem } from "@nuxt/ui";

definePageMeta({
  title: "Admin - JumpStats",
});

const items = [
  [
    {
      label: "Create User",
      icon: "i-lucide-user-plus",
      to: "/admin/users/create",
    },
    {
      label: "Create Organization",
      icon: "i-lucide-building",
      to: "/admin/orgs/create",
    },
  ],
] satisfies DropdownMenuItem[][];
</script>

<template>
  <UDashboardPanel id="admin-index">
    <template #header>
      <UDashboardNavbar title="Admin" :ui="{ right: 'gap-3' }">
        <template #leading>
          <UDashboardSidebarCollapse />
        </template>

        <template #right>
          <UDropdownMenu :items="items">
            <UButton icon="i-lucide-plus" size="md" class="rounded-full" />
          </UDropdownMenu>
        </template>
      </UDashboardNavbar>
    </template>

    <template #body>
      <AdminHomeStats />

      <UPageCard>
        <template #header>
          <h3 class="text-lg font-semibold">Quick Actions</h3>
          <p class="text-sm text-muted-foreground">Common administrative tasks</p>
        </template>

        <UPageGrid class="sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <UButton to="/admin/users" variant="outline" class="justify-start">
            <UIcon name="i-lucide-users" class="mr-2" />
            Manage Users
          </UButton>

          <UButton to="/admin/orgs" variant="outline" class="justify-start">
            <UIcon name="i-lucide-building" class="mr-2" />
            Manage Organizations
          </UButton>

          <UButton to="/admin/users/create" variant="outline" class="justify-start">
            <UIcon name="i-lucide-user-plus" class="mr-2" />
            Create User
          </UButton>

          <UButton to="/admin/orgs/create" variant="outline" class="justify-start">
            <UIcon name="i-lucide-building" class="mr-2" />
            Create Organization
          </UButton>
        </UPageGrid>
      </UPageCard>

      <UPageCard>
        <template #header>
          <h3 class="text-lg font-semibold">Recent Activity</h3>
          <p class="text-sm text-muted-foreground">Latest platform activities</p>
        </template>

        <div class="text-muted-foreground text-center py-8">
          <UIcon name="i-lucide-clock" class="size-12 mx-auto mb-4 opacity-50" />
          <p>No recent activity to display.</p>
          <p class="text-sm">Activity will appear here as users interact with the platform.</p>
        </div>
      </UPageCard>
    </template>
  </UDashboardPanel>
</template>

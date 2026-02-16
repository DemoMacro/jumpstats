<script setup lang="ts">
import type { NavigationMenuItem } from "@nuxt/ui";

definePageMeta({
  layout: "dashboard",
  title: "Organization - Dashboard - JumpStats",
});

const toast = useToast();

// Get active organization
const activeOrgResult = authClient.useActiveOrganization();
const activeOrg = computed(() => activeOrgResult.value.data);

const loading = ref(false);
const error = ref<string | null>(null);

// Fetch active organization details
async function fetchOrganization() {
  if (!activeOrg.value?.id) {
    error.value = "No active organization found";
    return;
  }

  loading.value = true;
  error.value = null;
  try {
    // Force refetch by calling the API directly
    const orgId = activeOrg.value?.id;
    if (!orgId) {
      error.value = "No active organization found";
      return;
    }

    const { data, error: err } = await authClient.organization.getFullOrganization({
      query: { organizationId: orgId },
    });

    if (err) {
      error.value = err.message || "Failed to fetch organization";
      return;
    }

    // The reactive hook will update automatically when the cache refreshes
  } catch (err) {
    error.value = err instanceof Error ? err.message : "Failed to fetch organization";
  } finally {
    loading.value = false;
  }
}

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

onMounted(() => {
  fetchOrganization();
});
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
      <div v-if="loading && !activeOrg" class="flex items-center justify-center h-64">
        <UIcon name="i-lucide-loader-2" class="animate-spin size-8" />
      </div>

      <div v-else-if="error" class="text-center py-8">
        <h3 class="text-lg font-semibold text-muted-foreground mb-2">Error</h3>
        <p class="text-muted-foreground mb-4">{{ error }}</p>
        <UButton @click="fetchOrganization">Retry</UButton>
      </div>

      <div v-else-if="!activeOrg" class="text-center py-8">
        <h3 class="text-lg font-semibold text-muted-foreground mb-2">No Active Organization</h3>
        <p class="text-muted-foreground mb-4">
          Please select an organization from the menu or create a new one.
        </p>
        <UButton to="/dashboard/org/create">Create Organization</UButton>
      </div>

      <div v-else class="flex flex-col gap-4 sm:gap-6 lg:gap-12 w-full lg:max-w-2xl mx-auto">
        <NuxtPage />
      </div>
    </template>
  </UDashboardPanel>
</template>

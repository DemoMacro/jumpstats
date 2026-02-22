<script setup lang="ts">
definePageMeta({
  title: "Organization Security - Dashboard - JS.GS",
});

const toast = useToast();

// Get active organization
const activeOrgResult = authClient.useActiveOrganization();
const activeOrg = computed(() => activeOrgResult.value.data);

const loading = ref(false);
const error = ref<string | null>(null);

// Fetch organization details
async function fetchOrganization() {
  if (!activeOrg.value?.id) {
    return;
  }

  loading.value = true;
  error.value = null;

  try {
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

// Handle refresh event from child components
function handleRefresh() {
  // Refresh organizations list in OrgsMenu
  refreshNuxtData("organizations");
}

// Load organization on mount
onMounted(() => {
  fetchOrganization();
});
</script>

<template>
  <div v-if="loading && !activeOrg" class="flex items-center justify-center h-64">
    <UIcon name="i-lucide-loader-2" class="animate-spin size-8" />
  </div>

  <div v-else-if="error && !activeOrg" class="text-center py-8">
    <h3 class="text-lg font-semibold text-muted-foreground mb-2">Error</h3>
    <p class="text-muted-foreground mb-4">{{ error }}</p>
    <UButton @click="fetchOrganization">Retry</UButton>
  </div>

  <div v-else-if="!activeOrg" class="text-center py-8">
    <h3 class="text-lg font-semibold text-muted-foreground mb-2">No Active Organization</h3>
    <p class="text-muted-foreground mb-4">
      Please select an organization from the menu or create a new one.
    </p>
    <UButton to="/dashboard/create-org">Create Organization</UButton>
  </div>

  <div v-else class="space-y-6">
    <DashboardOrgSecuritySettings :organization="activeOrg" @refresh="handleRefresh" />
  </div>
</template>

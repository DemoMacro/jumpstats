<script setup lang="ts">
definePageMeta({
  title: "Organization Security - Dashboard - JumpStats",
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
    <UButton to="/dashboard/org/create">Create Organization</UButton>
  </div>

  <div v-else class="space-y-6">
    <!-- Delete Organization Section -->
    <UPageCard
      title="Delete Organization"
      description="No longer want to use this organization? You can delete it here. This action is not reversible - all information related to this organization will be deleted permanently."
      class="bg-gradient-to-tl from-error/10 from-5% to-default"
    >
      <template #footer>
        <AdminOrgsDeleteModal :organization="activeOrg">
          <UButton label="Delete organization" color="error" icon="i-lucide-trash-2" />
        </AdminOrgsDeleteModal>
      </template>
    </UPageCard>

    <!-- Leave Organization Section -->
    <UPageCard
      title="Leave Organization"
      description="Want to leave this organization? You can remove yourself from this organization. If you're the only owner, you'll need to delete the organization instead."
    >
      <template #footer>
        <UButton
          label="Leave organization"
          color="neutral"
          variant="outline"
          icon="i-lucide-log-out"
          @click="
            async () => {
              if (!activeOrg) return;
              const result = await authClient.organization.leave({
                organizationId: activeOrg.id,
              });
              if (result.error) {
                toast.add({
                  title: 'Error',
                  description: result.error.message || 'Failed to leave organization',
                  color: 'error',
                });
              } else {
                toast.add({
                  title: 'Success',
                  description: 'You have left the organization',
                  icon: 'i-lucide-check',
                  color: 'success',
                });
                await navigateTo('/dashboard');
              }
            }
          "
        />
      </template>
    </UPageCard>
  </div>
</template>

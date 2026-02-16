<script setup lang="ts">
definePageMeta({
  title: "Organization Security - Admin - JumpStats",
});

const route = useRoute();
const orgId = route.params.id as string;

// Use composable for organization data
const { organization, loading } = useAdminOrg(orgId);
</script>

<template>
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

  <div v-else>
    <!-- Account Section -->
    <UPageCard
      title="Account"
      description="No longer want to use our service? You can delete this organization here. This action is not reversible. All information related to this organization will be deleted permanently."
      class="bg-linear-to-tl from-error/10 from-5% to-default"
    >
      <template #footer>
        <AdminOrgsDeleteModal :organization="organization">
          <UButton label="Delete organization" color="error" />
        </AdminOrgsDeleteModal>
      </template>
    </UPageCard>
  </div>
</template>

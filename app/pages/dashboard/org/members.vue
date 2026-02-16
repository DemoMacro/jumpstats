<script setup lang="ts">
definePageMeta({
  title: "Organization Members - Dashboard - JumpStats",
});

const toast = useToast();

// Get active organization
const activeOrgResult = authClient.useActiveOrganization();
const activeOrg = computed(() => activeOrgResult.value.data);

// Use composable for member management
const orgId = computed(() => activeOrg.value?.id || "");
const { members, loading, fetchMembers, removeMember, updateMemberRole } = useOrgMembers(
  orgId.value,
);

// Watch for org changes and fetch members
watch(
  orgId,
  (newOrgId) => {
    if (newOrgId) {
      fetchMembers();
    }
  },
  { immediate: true },
);

// Search state
const searchValue = ref("");

// Filter members based on search value
const filteredMembers = computed(() => {
  if (!searchValue.value) return members.value;

  const searchLower = searchValue.value.toLowerCase();
  return members.value.filter((member) => {
    const name = member.user?.name?.toLowerCase() || "";
    const email = member.user?.email?.toLowerCase() || "";
    return name.includes(searchLower) || email.includes(searchLower);
  });
});

// Handle role update
async function handleRoleUpdate(memberId: string, newRole: string) {
  try {
    await updateMemberRole(memberId, newRole);
    toast.add({
      title: "Success",
      description: "Member role updated successfully",
      icon: "i-lucide-check",
      color: "success",
    });
  } catch (err) {
    toast.add({
      title: "Error",
      description: err instanceof Error ? err.message : "Failed to update member role",
      color: "error",
    });
  }
}

// Handle member removal
async function handleRemove(memberId: string) {
  try {
    await removeMember(memberId);
    toast.add({
      title: "Success",
      description: "Member removed successfully",
      icon: "i-lucide-check",
      color: "success",
    });
  } catch (err) {
    toast.add({
      title: "Error",
      description: err instanceof Error ? err.message : "Failed to remove member",
      color: "error",
    });
  }
}
</script>

<template>
  <div class="space-y-6">
    <!-- Invite Members Card -->
    <UPageCard
      title="Invite Members"
      description="Invite new members by email address."
      variant="naked"
      orientation="horizontal"
      class="mb-4"
    >
      <DashboardOrgMemberAddModal :organization="activeOrg">
        <UButton label="Invite people" color="neutral" class="w-fit lg:ms-auto">
          <template #leading>
            <UIcon name="i-lucide-user-plus" />
          </template>
        </UButton>
      </DashboardOrgMemberAddModal>
    </UPageCard>

    <!-- Members List Card -->
    <UPageCard
      variant="subtle"
      :ui="{
        container: 'p-0 sm:p-0 gap-y-0',
        wrapper: 'items-stretch',
        header: 'p-4 mb-0 border-b border-default',
      }"
    >
      <template #header>
        <UInput
          v-model="searchValue"
          icon="i-lucide-search"
          placeholder="Search members"
          class="w-full"
        />
      </template>

      <!-- Loading State -->
      <div v-if="loading && members.length === 0" class="flex items-center justify-center py-8">
        <UIcon name="i-lucide-loader-2" class="animate-spin size-6" />
      </div>

      <!-- Empty State -->
      <div v-else-if="members.length === 0" class="text-center py-8">
        <UIcon name="i-lucide-users" class="size-12 text-muted mx-auto mb-4" />
        <h3 class="text-lg font-semibold mb-2">No members found</h3>
        <p class="text-sm text-muted">This organization doesn't have any members yet.</p>
      </div>

      <!-- Members List -->
      <DashboardOrgMembersList
        v-else
        :members="filteredMembers"
        :can-update-role="true"
        :can-remove="true"
        @update-role="handleRoleUpdate"
        @remove="handleRemove"
      />
    </UPageCard>
  </div>
</template>

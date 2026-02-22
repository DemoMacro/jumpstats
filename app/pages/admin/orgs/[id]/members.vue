<script setup lang="ts">
import type { Organization } from "better-auth/plugins";

definePageMeta({
  title: "Organization Members - Admin - JS.GS",
});

const toast = useToast();

const route = useRoute();
const orgId = route.params.id as string;

// Use composables for data
const { organization, loading: orgLoading } = useOrg(orgId);
const {
  members,
  loading: membersLoading,
  fetchMembers,
  removeMember,
  updateMemberRole,
} = useOrgMembers(orgId);

// Load members on mount
onMounted(() => {
  fetchMembers();
});

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

// Handle role update (admin view - typically disabled)
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
</script>

<template>
  <div>
    <UPageCard
      title="Members"
      description="Invite new members by email address."
      variant="naked"
      orientation="horizontal"
      class="mb-4"
    >
      <DashboardOrgMemberAddModal :organization="organization">
        <UButton label="Invite people" color="neutral" class="w-fit lg:ms-auto">
          <template #leading>
            <UIcon name="i-lucide-user-plus" />
          </template>
        </UButton>
      </DashboardOrgMemberAddModal>
    </UPageCard>

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
          autofocus
          class="w-full"
        />
      </template>

      <!-- Loading State -->
      <div v-if="orgLoading || membersLoading" class="flex items-center justify-center py-8">
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
        :can-update-role="false"
        :can-remove="false"
      />
    </UPageCard>
  </div>
</template>

<script setup lang="ts">
import type { Member } from "better-auth/plugins";

definePageMeta({
  title: "Organization Members - Dashboard - JumpStats",
});

const toast = useToast();

// Get active organization
const activeOrgResult = authClient.useActiveOrganization();
const activeOrg = computed(() => activeOrgResult.value.data);

// Members state
const members = ref<Member[]>([]);
const loading = ref(false);
const error = ref<string | null>(null);
const searchValue = ref("");

// Fetch members
async function fetchMembers() {
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

    const result = await authClient.organization.listMembers({
      query: {
        organizationId: orgId,
        limit: 100,
      },
    });

    if (result.error) {
      const errorMsg = result.error.message || "Failed to fetch members";
      error.value = errorMsg;
      toast.add({
        title: "Error",
        description: errorMsg,
        color: "error",
      });
      return;
    }

    members.value = result.data?.members || [];
  } catch (err) {
    error.value = err instanceof Error ? err.message : "Failed to fetch members";
    toast.add({
      title: "Error",
      description: error.value,
      color: "error",
    });
  } finally {
    loading.value = false;
  }
}

// Remove member
async function removeMember(memberId: string) {
  const orgId = activeOrg.value?.id;
  if (!orgId) {
    return;
  }

  try {
    const result = await authClient.organization.removeMember({
      memberIdOrEmail: memberId,
      organizationId: orgId,
    });

    if (result.error) {
      toast.add({
        title: "Error",
        description: result.error.message || "Failed to remove member",
        color: "error",
      });
      return;
    }

    toast.add({
      title: "Success",
      description: "Member removed successfully",
      color: "success",
    });

    // Remove from local state
    members.value = members.value.filter((m) => m.id !== memberId);
  } catch (err) {
    toast.add({
      title: "Error",
      description: err instanceof Error ? err.message : "Failed to remove member",
      color: "error",
    });
  }
}

// Load members on mount
onMounted(() => {
  fetchMembers();
});

// Watch for active org changes
watch(activeOrg, () => {
  fetchMembers();
});
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
      <AdminOrgsMemberAddModal :organization="activeOrg" @refresh="fetchMembers">
        <UButton label="Invite people" color="neutral" class="w-fit lg:ms-auto">
          <template #leading>
            <UIcon name="i-lucide-user-plus" />
          </template>
        </UButton>
      </AdminOrgsMemberAddModal>
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

      <!-- Members List -->
      <div class="p-4">
        <div v-if="loading" class="flex items-center justify-center py-8">
          <UIcon name="i-lucide-loader-2" class="animate-spin size-6" />
        </div>

        <div v-else-if="error" class="text-center py-8">
          <h3 class="text-lg font-semibold text-muted-foreground mb-2">Error Loading Members</h3>
          <p class="text-muted-foreground mb-4">{{ error }}</p>
          <UButton @click="fetchMembers">Retry</UButton>
        </div>

        <div v-else-if="members.length === 0" class="text-center py-8">
          <UIcon name="i-lucide-users" class="size-12 text-muted-foreground mx-auto mb-4" />
          <h3 class="text-lg font-semibold text-muted-foreground mb-2">No members found</h3>
          <p class="text-muted-foreground mb-4">This organization doesn't have any members yet.</p>
          <AdminOrgsMemberAddModal :organization="activeOrg" @refresh="fetchMembers">
            <UButton color="primary" class="mx-auto">
              <template #leading>
                <UIcon name="i-lucide-user-plus" />
              </template>
              Invite First Member
            </UButton>
          </AdminOrgsMemberAddModal>
        </div>

        <div v-else class="space-y-3">
          <UCard
            v-for="member in members.filter((m) =>
              m.userId?.toLowerCase().includes(searchValue.toLowerCase()),
            )"
            :key="member.id"
            class="p-0"
          >
            <div class="flex items-center justify-between">
              <div class="flex items-center gap-4">
                <div class="size-10 bg-primary/10 rounded-full flex items-center justify-center">
                  <UIcon name="i-lucide-user" class="size-5 text-primary" />
                </div>
                <div>
                  <div class="font-medium">{{ member.userId }}</div>
                  <div class="text-sm text-muted-foreground">
                    Joined {{ new Date(member.createdAt).toLocaleDateString() }}
                  </div>
                </div>
              </div>

              <div class="flex items-center gap-2">
                <UBadge
                  :color="
                    member.role === 'owner'
                      ? 'primary'
                      : member.role === 'admin'
                        ? 'primary'
                        : 'neutral'
                  "
                  variant="soft"
                >
                  {{ member.role }}
                </UBadge>

                <UButton
                  icon="i-lucide-trash-2"
                  color="error"
                  variant="ghost"
                  size="xs"
                  :disabled="member.role === 'owner'"
                  @click="removeMember(member.id)"
                >
                  Remove
                </UButton>
              </div>
            </div>
          </UCard>
        </div>
      </div>
    </UPageCard>
  </div>
</template>

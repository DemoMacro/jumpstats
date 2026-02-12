<script setup lang="ts">
import type { Organization } from "better-auth/plugins";

definePageMeta({
  title: "Organization Members - Admin - JumpStats",
});

const route = useRoute();
const orgId = route.params.id as string;

// Use composables for data
const { organization, loading: orgLoading, error: orgError, fetchOrg } = useAdminOrg(orgId);
const {
  members,
  loading: membersLoading,
  error: membersError,
  fetchMembers,
  inviteMember,
} = useOrgMembers(orgId);

// Search state
const searchValue = ref("");

// Load data on mount
onMounted(async () => {
  await fetchOrg();
  fetchMembers();
});
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
      <AdminOrgsMemberAddModal :organization="organization" @refresh="fetchMembers">
        <UButton label="Invite people" color="neutral" class="w-fit lg:ms-auto">
          <template #leading>
            <UIcon name="i-lucide-user-plus" />
          </template>
        </UButton>
      </AdminOrgsMemberAddModal>
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

      <!-- Members List -->
      <div class="p-4">
        <div v-if="orgLoading || membersLoading" class="flex items-center justify-center py-8">
          <UIcon name="i-lucide-loader-2" class="animate-spin size-6" />
        </div>

        <div v-else-if="members.length === 0" class="text-center py-8">
          <UIcon name="i-lucide-users" class="size-12 text-muted-foreground mx-auto mb-4" />
          <h3 class="text-lg font-semibold text-muted-foreground mb-2">No members found</h3>
          <p class="text-muted-foreground">This organization doesn't have any members yet.</p>
          <AdminOrgsMemberAddModal :organization="organization" @refresh="fetchMembers">
            <UButton color="primary" class="mx-auto">
              <UIcon name="i-lucide-user-plus" class="mr-2" />
              Invite First Member
            </UButton>
          </AdminOrgsMemberAddModal>
        </div>

        <div v-else class="space-y-3">
          <UCard
            v-for="member in members.filter((m) =>
              m.userId.toLowerCase().includes(searchValue.toLowerCase()),
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
              </div>
            </div>
          </UCard>
        </div>
      </div>
    </UPageCard>
  </div>
</template>

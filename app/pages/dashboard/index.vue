<script setup lang="ts">
import type { DropdownMenuItem } from "@nuxt/ui";
import type { Link } from "~~/shared/types/link";
import { authClient } from "~/utils/auth";
import { useDomains } from "~/composables/useDomains";

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

const toast = useToast();
const { copy, copied, isSupported } = useClipboard();
const { domains } = useDomains();

// Get active organization
const activeOrgResult = authClient.useActiveOrganization();
const activeOrg = computed(() => activeOrgResult.value.data);

// Watch copied state and show toast notification
watch(copied, (isCopied) => {
  if (isCopied) {
    toast.add({
      title: "Success",
      description: "Link copied to clipboard",
      color: "success",
    });
  }
});

// Helper function to get the actual domain for a link
function getLinkDomain(link: Link) {
  if (!link.domainId) {
    return window.location.origin;
  }
  const domain = domains.value.find((d) => d.id === link.domainId);
  return domain?.domainName || window.location.origin;
}

async function copyToClipboard(link: Link) {
  if (!isSupported.value) {
    toast.add({
      title: "Error",
      description: "Clipboard not supported in this browser",
      color: "error",
    });
    return;
  }

  const domain = getLinkDomain(link);
  const url = `${domain}/s/${link.shortCode}`;
  await copy(url);
}

// Fetch recent links (latest 5)
const {
  data: linksData,
  pending: loading,
  refresh,
  error,
} = await useAsyncData(
  "recent-links",
  async () => {
    // Build query based on active organization
    const query: Record<string, any> = { limit: 5 };
    if (activeOrg.value?.id) {
      query.organizationId = activeOrg.value.id;
    }

    const result = await authClient.link.list({
      query,
    });
    return result.data;
  },
  {
    transform: (data) => ({
      links: data?.links ?? [],
      total: data?.total ?? 0,
    }),
    watch: [activeOrg], // Re-fetch when active organization changes
  },
);

const recentLinks = computed(() => linksData.value?.links ?? []);

// Watch for errors and display toast notification
watch(error, (newError) => {
  if (newError) {
    toast.add({
      title: "Error",
      description: "Failed to fetch recent links",
      color: "error",
    });
  }
});
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
    </template>

    <template #body>
      <UPageCard>
        <template #header>
          <h3 class="text-lg font-semibold">Quick Actions</h3>
          <p class="text-sm text-muted-foreground">Common link management tasks</p>
        </template>

        <UPageGrid class="sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <UButton to="/dashboard/links/create" variant="outline" class="justify-start">
            <UIcon name="i-lucide-plus" class="mr-2" />
            Create Link
          </UButton>

          <UButton to="/dashboard/settings" variant="outline" class="justify-start">
            <UIcon name="i-lucide-settings" class="mr-2" />
            Settings
          </UButton>
        </UPageGrid>
      </UPageCard>

      <UCard :ui="{ body: 'px-0 py-3 sm:px-0 sm:py-3' }">
        <template #header>
          <div class="flex items-center justify-between">
            <div>
              <h3 class="text-lg font-semibold">Recent Links</h3>
              <p class="text-sm text-muted-foreground">Your most recently created links</p>
            </div>
            <UButton
              to="/dashboard/links"
              variant="ghost"
              size="sm"
              trailing-icon="i-lucide-arrow-right"
            >
              View All
            </UButton>
          </div>
        </template>

        <div v-if="loading" class="text-center py-8">
          <UIcon name="i-lucide-loader-2" class="size-8 mx-auto mb-4 animate-spin" />
          <p class="text-muted-foreground">Loading links...</p>
        </div>

        <div v-else-if="recentLinks.length === 0" class="text-muted-foreground text-center py-8">
          <UIcon name="i-lucide-link" class="size-12 mx-auto mb-4 opacity-50" />
          <p>No links yet.</p>
          <p class="text-sm">Create your first short link to get started!</p>
        </div>

        <div v-else>
          <template v-for="(link, index) in recentLinks" :key="link.id">
            <div
              class="flex items-center justify-between gap-4 px-6 py-3 hover:bg-muted/50 transition-colors w-full"
            >
              <NuxtLink
                :to="`${getLinkDomain(link)}/s/${link.shortCode}`"
                class="flex items-center gap-3 flex-1 min-w-0"
                target="_blank"
              >
                <UIcon name="i-lucide-link" class="size-4 text-muted-foreground shrink-0" />
                <div class="flex-1 min-w-0">
                  <p class="text-sm font-medium truncate">
                    {{ link.title || link.shortCode }}
                  </p>
                  <p class="text-xs text-muted-foreground truncate">
                    {{ getLinkDomain(link) }}/s/{{ link.shortCode }}
                  </p>
                </div>
              </NuxtLink>

              <div class="flex items-center gap-1 shrink-0">
                <UButton
                  :to="`/dashboard/links/${link.id}`"
                  variant="ghost"
                  size="sm"
                  icon="i-lucide-eye"
                  title="View Details"
                />

                <UButton
                  variant="ghost"
                  size="sm"
                  icon="i-lucide-copy"
                  title="Copy Link"
                  @click="copyToClipboard(link)"
                />

                <DashboardLinkDeleteModal :link="link" @refresh="refresh">
                  <UButton
                    variant="ghost"
                    size="sm"
                    icon="i-lucide-trash"
                    color="error"
                    title="Delete Link"
                  />
                </DashboardLinkDeleteModal>
              </div>
            </div>
            <USeparator v-if="index < recentLinks.length - 1" />
          </template>
        </div>
      </UCard>
    </template>
  </UDashboardPanel>
</template>

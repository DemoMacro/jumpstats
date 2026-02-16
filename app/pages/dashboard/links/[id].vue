<script setup lang="ts">
import type { NavigationMenuItem } from "@nuxt/ui";
import { useDomains } from "~/composables/useDomains";

definePageMeta({
  layout: "dashboard",
  title: "Link Details - Dashboard - JumpStats",
});

const route = useRoute();
const linkId = route.params.id as string;

const toast = useToast();

const { link, loading, fetchLink } = useLinkDetail(linkId);
const { domains } = useDomains();

const { copy, copied, isSupported } = useClipboard();

// Helper function to get the actual domain for a link
function getLinkDomain() {
  if (!link.value?.domainId) {
    return window.location.origin;
  }
  const domainId = link.value.domainId;
  const domain = domains.value.find((d) => d.id === domainId);
  return domain?.domainName || window.location.origin;
}

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

async function copyToClipboard() {
  if (!link.value) {
    return;
  }

  if (!isSupported.value) {
    toast.add({
      title: "Error",
      description: "Clipboard not supported in this browser",
      color: "error",
    });
    return;
  }

  const domain = getLinkDomain();
  const url = `${domain}/s/${link.value.shortCode}`;
  await copy(url);
}

// Get analytics composables - they create and manage their own refs
const { range } = useLinkAnalytics(linkId);

const links = computed<NavigationMenuItem[][]>(() => [
  [
    {
      label: "Overview",
      icon: "i-lucide-link",
      to: `/dashboard/links/${linkId}`,
      exact: true,
    },
    {
      label: "Events",
      icon: "i-lucide-list",
      to: `/dashboard/links/${linkId}/events`,
    },
    {
      label: "Edit",
      icon: "i-lucide-edit",
      to: `/dashboard/links/${linkId}/edit`,
    },
  ],
]);
</script>

<template>
  <UDashboardPanel id="link-details">
    <template #header>
      <UDashboardNavbar :title="`Link - ${link?.shortCode || 'Unknown'}`">
        <template #leading>
          <UDashboardSidebarCollapse />
        </template>

        <template #trailing>
          <div v-if="link" class="flex items-center gap-2">
            <UButton
              icon="i-lucide-copy"
              color="neutral"
              variant="ghost"
              title="Copy Link"
              @click="copyToClipboard"
            />

            <UPopover>
              <UButton
                icon="i-lucide-qr-code"
                color="neutral"
                variant="ghost"
                title="Show QR Code"
              />

              <template #content>
                <div class="p-4">
                  <img
                    :src="`/qr/${link.shortCode}`"
                    :alt="`QR Code for ${link.shortCode}`"
                    class="w-32 h-32"
                  />
                </div>
              </template>
            </UPopover>
          </div>
        </template>
      </UDashboardNavbar>

      <UDashboardToolbar>
        <template #left>
          <UNavigationMenu :items="links" highlight class="-mx-1 flex-1" />
        </template>

        <template #right>
          <DashboardLinkDateRangePicker v-model="range" />
        </template>
      </UDashboardToolbar>
    </template>

    <template #body>
      <div v-if="loading" class="flex items-center justify-center h-64">
        <UIcon name="i-lucide-loader-2" class="animate-spin size-8" />
      </div>

      <div v-else-if="!link" class="text-center py-8">
        <h3 class="text-lg font-semibold text-muted-foreground mb-2">Link not found</h3>
        <p class="text-muted-foreground mb-4">
          The link you're looking for doesn't exist or you don't have permission to view it.
        </p>
        <UButton to="/dashboard/links">Back to Links</UButton>
      </div>

      <div v-else class="flex flex-col gap-4 sm:gap-6 lg:gap-12 w-full h-full mx-auto">
        <NuxtPage :range="range" />
      </div>
    </template>
  </UDashboardPanel>
</template>

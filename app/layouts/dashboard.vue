<script setup lang="ts">
import type { NavigationMenuItem } from "@nuxt/ui";
import { authClient } from "~/utils/auth";

const route = useRoute();
const toast = useToast();

const open = ref(false);

const isAdmin = computed(() => route.path.startsWith("/admin"));

const adminLinks = [
  {
    label: "Admin",
    icon: "i-lucide-house",
    to: "/admin",
    onSelect: () => {
      open.value = false;
    },
    exact: true,
  },
  {
    label: "Users",
    icon: "i-lucide-users",
    to: "/admin/users",
    onSelect: () => {
      open.value = false;
    },
  },
  {
    label: "Organizations",
    icon: "i-lucide-building",
    to: "/admin/orgs",
    onSelect: () => {
      open.value = false;
    },
  },
  {
    label: "Sessions",
    icon: "i-lucide-activity",
    to: "/admin/sessions",
    onSelect: () => {
      open.value = false;
    },
  },
];

const dashboardLinks = [
  {
    label: "Dashboard",
    icon: "i-lucide-house",
    to: "/dashboard",
    onSelect: () => {
      open.value = false;
    },
    exact: true,
  },
  {
    label: "Links",
    icon: "i-lucide-link",
    to: "/dashboard/links",
    onSelect: () => {
      open.value = false;
    },
  },
  {
    label: "Domains",
    icon: "i-lucide-globe",
    to: "/dashboard/domains",
    onSelect: () => {
      open.value = false;
    },
  },
];

// Get active organization to conditionally show Organization link
const activeOrgResult = authClient.useActiveOrganization();
const hasActiveOrg = computed(() => !!activeOrgResult.value.data);

// Add Organization link if there's an active organization
const organizationLink = {
  label: "Organization",
  icon: "i-lucide-building",
  to: "/dashboard/org",
  onSelect: () => {
    open.value = false;
  },
};

const links = computed(() => {
  const mainLinks = isAdmin.value ? adminLinks : dashboardLinks;

  // Add Organization link to dashboard if there's an active organization
  const finalMainLinks = isAdmin.value
    ? mainLinks
    : [...mainLinks, ...(hasActiveOrg.value ? [organizationLink] : [])];

  return [
    finalMainLinks,
    [
      {
        label: "Feedback",
        icon: "i-lucide-message-circle",
        to: "https://github.com/DemoMacro/JumpStats/issues",
        target: "_blank",
      },
      {
        label: "Help & Support",
        icon: "i-lucide-info",
        to: "https://github.com/DemoMacro/JumpStats",
        target: "_blank",
      },
    ],
  ] satisfies NavigationMenuItem[][];
});

const groups = computed(() => [
  {
    id: "links",
    label: "Go to",
    items: links.value.flat(),
  },
  {
    id: "code",
    label: "Code",
    items: [
      {
        id: "source",
        label: "View page source",
        icon: "i-simple-icons-github",
        to: `https://github.com/DemoMacro/JumpStats/blob/main/app/pages${route.path === "/" ? "/index" : route.path}.vue`,
        target: "_blank",
      },
    ],
  },
]);

onMounted(async () => {
  const cookie = useCookie("cookie-consent", {
    maxAge: 365 * 24 * 60 * 60, // 1 year
    sameSite: "lax",
  });
  if (cookie.value === "accepted") {
    return;
  }

  toast.add({
    title: "We use first-party cookies to enhance your experience on our website.",
    duration: 0,
    close: false,
    actions: [
      {
        label: "Accept",
        color: "neutral",
        variant: "outline",
        onClick: () => {
          cookie.value = "accepted";
        },
      },
      {
        label: "Opt out",
        color: "neutral",
        variant: "ghost",
      },
    ],
  });
});
</script>

<template>
  <UDashboardGroup unit="rem">
    <UDashboardSidebar
      id="default"
      v-model:open="open"
      collapsible
      resizable
      class="bg-elevated/25"
      :ui="{ footer: 'lg:border-t lg:border-default' }"
    >
      <template #header="{ collapsed }">
        <OrgsMenu :collapsed="collapsed" />
      </template>

      <template #default="{ collapsed }">
        <UDashboardSearchButton :collapsed="collapsed" class="bg-transparent ring-default" />

        <UNavigationMenu
          :collapsed="collapsed"
          :items="links[0]"
          orientation="vertical"
          tooltip
          popover
        />

        <UNavigationMenu
          :collapsed="collapsed"
          :items="links[1]"
          orientation="vertical"
          tooltip
          class="mt-auto"
        />
      </template>

      <template #footer="{ collapsed }">
        <UserMenu :collapsed="collapsed" />
      </template>
    </UDashboardSidebar>

    <UDashboardSearch :groups="groups" />

    <slot />
  </UDashboardGroup>
</template>

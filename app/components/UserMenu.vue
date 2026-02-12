<script setup lang="ts">
import type { DropdownMenuItem } from "@nuxt/ui";

defineProps<{
  collapsed?: boolean;
}>();

const toast = useToast();

// Get current user session
const { data: session } = await authClient.useSession(useFetch);

// Check if user has admin role
const isAdmin = computed(() => {
  return session.value?.user?.role === "admin";
});

// Get current route
const route = useRoute();

// Check if currently in admin section
const isInAdmin = computed(() => {
  return route.path.startsWith("/admin");
});

// Navigation functionality
async function navigateToDashboard() {
  await navigateTo("/dashboard");
}

async function navigateToAdmin() {
  await navigateTo("/admin");
}

// Sign out functionality
async function handleSignOut() {
  try {
    const { $authClient } = useNuxtApp();

    await $authClient.signOut({
      fetchOptions: {
        onSuccess: async () => {
          toast.add({
            title: "Signed Out",
            description: "You have been successfully signed out",
            color: "success",
          });
          await navigateTo("/auth/sign-in");
        },
      },
    });
  } catch (error) {
    toast.add({
      title: "Sign Out Error",
      description: "An error occurred while signing out",
      color: "error",
    });
  }
}

const items = computed<DropdownMenuItem[][]>(() => {
  const adminNavigationItems = isAdmin.value
    ? [
        {
          label: isInAdmin.value ? "Go to Dashboard" : "Go to Admin",
          icon: isInAdmin.value ? "i-lucide-layout-dashboard" : "i-lucide-shield",
          onSelect: isInAdmin.value ? navigateToDashboard : navigateToAdmin,
        },
      ]
    : [];

  return [
    [
      {
        type: "label",
        label: session.value?.user?.name || session.value?.user?.email,
        avatar: {
          src: session.value?.user.image || undefined,
          alt: session.value?.user?.name || session.value?.user?.email,
        },
      },
    ],
    [
      ...adminNavigationItems,
      {
        label: "Profile",
        icon: "i-lucide-user",
      },
      {
        label: "Settings",
        icon: "i-lucide-cog",
      },
    ],
    [
      {
        label: "Sign Out",
        icon: "i-lucide-log-out",
        color: "error",
        onSelect: handleSignOut,
      },
    ],
  ];
});
</script>

<template>
  <UDropdownMenu
    :items="items"
    :content="{ align: 'center', collisionPadding: 12 }"
    :ui="{
      content: collapsed ? 'w-48' : 'w-(--reka-dropdown-menu-trigger-width)',
    }"
  >
    <UButton
      v-bind="{
        ...session?.user,
        label: collapsed ? undefined : session?.user?.name || session?.user?.email,
        trailingIcon: collapsed ? undefined : 'i-lucide-chevrons-up-down',
      }"
      color="neutral"
      variant="ghost"
      block
      :square="collapsed"
      class="data-[state=open]:bg-elevated"
      :ui="{
        trailingIcon: 'text-dimmed',
      }"
      :avatar="{
        src: session?.user?.image || undefined,
        alt: session?.user?.name || session?.user?.email,
      }"
    />
  </UDropdownMenu>
</template>

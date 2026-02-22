<script setup lang="ts">
import type { NavigationMenuItem } from "@nuxt/ui";
import { authClient } from "~/utils/auth";

const route = useRoute();

// Get current user session
const { data: session } = await authClient.useSession(useFetch);

// Define navigation menu items
const items = computed<NavigationMenuItem[]>(() => {
  const baseItems: NavigationMenuItem[] = [
    {
      label: "Home",
      to: "/",
      active: route.path === "/",
      icon: "i-lucide-house",
    },
    {
      label: "Dashboard",
      to: "/dashboard",
      active: route.path.startsWith("/dashboard"),
      icon: "i-lucide-layout-dashboard",
    },
  ];

  return baseItems;
});
</script>

<template>
  <UApp>
    <UHeader>
      <template #title>
        <NuxtLink to="/" class="flex items-center gap-1.5 font-semibold text-lg"> JS.GS </NuxtLink>
      </template>

      <UNavigationMenu :items="items" />

      <template #right>
        <template v-if="session?.user">
          <div class="max-w-48">
            <UserMenu />
          </div>
        </template>

        <template v-else>
          <UButton to="/auth/sign-in" label="Sign In" color="neutral" variant="ghost" />
          <UButton to="/auth/sign-up" label="Sign Up" color="neutral" />
        </template>
      </template>

      <template #body>
        <UNavigationMenu :items="items" orientation="vertical" class="-mx-2.5" />
      </template>
    </UHeader>

    <UMain>
      <NuxtPage />
    </UMain>

    <USeparator />

    <UFooter>
      <template #left>
        <p class="text-sm text-muted-foreground">JS.GS • {{ new Date().getFullYear() }}</p>
      </template>

      <UNavigationMenu
        :items="[
          { label: 'Privacy Policy', to: '/privacy' },
          { label: 'Terms of Service', to: '/terms' },
        ]"
        variant="link"
      />

      <template #right>
        <UButton
          to="https://github.com/DemoMacro/JS.GS"
          target="_blank"
          icon="i-simple-icons-github"
          aria-label="GitHub"
          color="neutral"
          variant="ghost"
        />
      </template>
    </UFooter>
  </UApp>
</template>

<script setup lang="ts">
import type { Organization } from "better-auth/plugins";
import type { DropdownMenuItem } from "@nuxt/ui";
import { authClient } from "~/utils/auth";

defineProps<{
  collapsed?: boolean;
}>();

const toast = useToast();

// Get user's organizations - this returns a reactive result
const orgsResult = authClient.useListOrganizations();

// Get active organization - this returns a reactive result
const activeOrgResult = authClient.useActiveOrganization();

// Loading state for switching
const switching = ref(false);

// Current active entity (personal or organization)
const currentEntity = computed(() => {
  // The result is directly the data
  const activeOrg = activeOrgResult.value.data;
  if (activeOrg) {
    return {
      label: activeOrg.name,
      icon: "i-lucide-building",
      type: "organization",
    };
  }
  return {
    label: "Personal",
    icon: "i-lucide-user",
    type: "personal",
  };
});

// Switch between personal and organization
async function switchContext(entityId: string) {
  if (switching.value) return;

  switching.value = true;
  try {
    if (entityId === "personal") {
      // Switch to personal mode
      const { error } = await authClient.organization.setActive({
        organizationId: null,
      });

      if (error) {
        toast.add({
          title: "Switch Failed",
          description: error.message || "Failed to switch to personal account",
          color: "error",
        });
        return;
      }

      toast.add({
        title: "Switched to Personal",
        description: "You are now using your personal account",
        color: "success",
      });
    } else {
      // Switch to organization mode
      const { error } = await authClient.organization.setActive({
        organizationId: entityId,
      });

      if (error) {
        toast.add({
          title: "Switch Failed",
          description: error.message || "Failed to switch to organization",
          color: "error",
        });
        return;
      }

      const orgs = orgsResult.value.data;
      const org = orgs?.find((o: Organization) => o.id === entityId);
      toast.add({
        title: "Switched to Organization",
        description: `You are now working in ${org?.name || "the organization"}`,
        color: "success",
      });
    }
  } catch (error) {
    toast.add({
      title: "Switch Failed",
      description: error instanceof Error ? error.message : "An error occurred",
      color: "error",
    });
  } finally {
    switching.value = false;
  }
}

// Build dropdown menu items
const items = computed<DropdownMenuItem[][]>(() => {
  const personalOption = {
    label: "Personal",
    icon: "i-lucide-user",
    id: "personal",
    onSelect: () => switchContext("personal"),
  };

  const orgs = orgsResult.value.data;
  const organizationOptions =
    orgs?.map((org: Organization) => ({
      label: org.name,
      icon: "i-lucide-building",
      id: org.id,
      onSelect: () => switchContext(org.id),
    })) || [];

  return [
    [personalOption, ...organizationOptions],
    [
      {
        label: "Create organization",
        icon: "i-lucide-circle-plus",
        disabled: true, // TODO: Implement create organization feature
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
      content: collapsed ? 'w-40' : 'w-(--reka-dropdown-menu-trigger-width)',
    }"
  >
    <UButton
      :label="collapsed ? undefined : currentEntity.label"
      :icon="collapsed ? currentEntity.icon : undefined"
      :trailing-icon="collapsed ? undefined : 'i-lucide-chevrons-up-down'"
      color="neutral"
      variant="ghost"
      block
      :square="collapsed"
      :loading="switching"
      class="data-[state=open]:bg-elevated"
      :ui="{
        trailingIcon: 'text-dimmed',
      }"
    >
      <template v-if="!collapsed" #leading>
        <UIcon :name="currentEntity.icon" class="text-dimmed" />
      </template>
    </UButton>
  </UDropdownMenu>
</template>

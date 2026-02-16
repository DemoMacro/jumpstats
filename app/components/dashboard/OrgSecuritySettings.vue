<script setup lang="ts">
import type { Organization } from "better-auth/plugins";

interface Props {
  organization: Organization | null;
}

const props = defineProps<Props>();
const toast = useToast();

async function leaveOrganization() {
  if (!props.organization) return;

  const result = await authClient.organization.leave({
    organizationId: props.organization.id,
  });

  if (result.error) {
    toast.add({
      title: "Error",
      description: result.error.message || "Failed to leave organization",
      color: "error",
    });
  } else {
    toast.add({
      title: "Success",
      description: "You have left the organization",
      icon: "i-lucide-check",
      color: "success",
    });
    await navigateTo("/dashboard");
  }
}
</script>

<template>
  <div class="space-y-6">
    <!-- Delete Organization Section -->
    <UPageCard
      title="Delete Organization"
      description="No longer want to use this organization? You can delete it here. This action is not reversible - all information related to this organization will be deleted permanently."
      class="bg-linear-to-tl from-error/10 from-5% to-default"
    >
      <template #footer>
        <DashboardOrgDeleteModal :organization="organization">
          <UButton label="Delete organization" color="error" icon="i-lucide-trash-2" />
        </DashboardOrgDeleteModal>
      </template>
    </UPageCard>

    <!-- Leave Organization Section -->
    <UPageCard
      title="Leave Organization"
      description="Want to leave this organization? You can remove yourself from this organization. If you're the only owner, you'll need to delete the organization instead."
    >
      <template #footer>
        <UButton
          label="Leave organization"
          color="neutral"
          variant="outline"
          icon="i-lucide-log-out"
          @click="leaveOrganization"
        />
      </template>
    </UPageCard>
  </div>
</template>

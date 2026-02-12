<script setup lang="ts">
interface Stat {
  title: string;
  icon: string;
  value: number;
  variation?: number;
}

// Use admin stats composable
const { totalUsers, totalOrgs, adminUsers, activeSessions, loading, error, fetchStats } =
  useAdminStats();

// Define stats data
const stats = computed<Stat[]>(() => [
  {
    title: "Total Users",
    icon: "i-lucide-users",
    value: totalUsers.value,
    variation: 0,
  },
  {
    title: "Organizations",
    icon: "i-lucide-building",
    value: totalOrgs.value,
    variation: 0,
  },
  {
    title: "Admin Users",
    icon: "i-lucide-shield",
    value: adminUsers.value,
    variation: 0,
  },
  {
    title: "Active Sessions",
    icon: "i-lucide-activity",
    value: activeSessions.value,
    variation: 0,
  },
]);

// Load stats on mount
onMounted(() => {
  fetchStats();
});
</script>

<template>
  <UPageGrid class="lg:grid-cols-4 gap-4 sm:gap-6 lg:gap-px">
    <UPageCard
      v-for="(stat, index) in stats"
      :key="index"
      :icon="stat.icon"
      :title="stat.title"
      to="/admin/users"
      variant="subtle"
      :ui="{
        container: 'gap-y-1.5',
        wrapper: 'items-start',
        leading: 'p-2.5 rounded-full bg-primary/10 ring ring-inset ring-primary/25 flex-col',
        title: 'font-normal text-muted text-xs uppercase',
      }"
      class="lg:rounded-none first:rounded-l-lg last:rounded-r-lg hover:z-1"
    >
      <div v-if="loading" class="flex items-center gap-2">
        <UIcon name="i-lucide-loader-2" class="animate-spin size-4 text-muted-foreground" />
        <span class="text-muted-foreground text-sm">Loading...</span>
      </div>
      <div v-else-if="error" class="flex items-center gap-2">
        <UIcon name="i-lucide-alert-circle" class="size-4 text-error" />
        <span class="text-error text-sm">Error</span>
      </div>
      <div v-else class="flex items-center gap-2">
        <span class="text-2xl font-semibold text-highlighted">
          {{ stat.value.toLocaleString() }}
        </span>

        <UBadge
          v-if="stat.variation && stat.variation !== 0"
          :color="stat.variation > 0 ? 'success' : 'error'"
          variant="subtle"
          class="text-xs"
        >
          {{ stat.variation > 0 ? "+" : "" }}{{ stat.variation }}%
        </UBadge>
      </div>
    </UPageCard>
  </UPageGrid>
</template>

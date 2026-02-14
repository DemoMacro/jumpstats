<script setup lang="ts">
import type { TableColumn } from "@nuxt/ui";
import type { ClickEvent } from "~~/shared/types/analytics";
import { getPaginationRowModel } from "@tanstack/table-core";
import { format } from "date-fns";

definePageMeta({
  layout: "dashboard",
  title: "Events - Link Details - Dashboard - JumpStats",
});

const route = useRoute();
const linkId = route.params.id as string;
const { link } = useLinkDetail(linkId);

// Receive range from parent layout
const props = defineProps<{
  range?: {
    start: Date;
    end: Date;
  };
}>();

// Create a ref that uses parent's range if provided, otherwise creates default
const rangeRef = ref(
  props.range || {
    start: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
    end: new Date(),
  },
);

// Watch for changes from parent
watch(
  () => props.range,
  (newRange) => {
    if (newRange) {
      rangeRef.value = newRange;
    }
  },
  { immediate: true },
);

const table = useTemplateRef("table");
const globalFilter = ref("");
const columnVisibility = ref();
const rowSelection = ref({});

const pagination = ref({
  pageIndex: 0,
  pageSize: 50,
});

const toast = useToast();
const { $authClient } = useNuxtApp();

// Format date for display
const formatDate = (dateStr: string) => {
  // Append 'Z' to ensure UTC parsing (consistent with useLinkAnalytics.ts)
  const date = new Date(dateStr + "Z");
  return format(date, "MMM d, yyyy HH:mm:ss");
};

// Format date for ClickHouse query (YYYY-MM-DD HH:mm:ss)
const formatQueryDate = (date: Date) => {
  return date.toISOString().slice(0, 19).replace("T", " ");
};

// Fetch events using useAsyncData with SSR support and automatic caching
const {
  data: eventsData,
  pending: loading,
  refresh: fetchEvents,
  error,
} = await useAsyncData(
  "events",
  async () => {
    const start = formatQueryDate(rangeRef.value.start);
    const end = formatQueryDate(rangeRef.value.end);

    const result = await $authClient.link.events({
      query: {
        linkId,
        start,
        end,
        limit: pagination.value.pageSize,
        offset: pagination.value.pageIndex * pagination.value.pageSize,
      },
    });
    return result.data;
  },
  {
    transform: (data) => ({
      events: data?.events ?? [],
      total: data?.total ?? 0,
      limit: data?.limit ?? 50,
      offset: data?.offset ?? 0,
    }),
  },
);

const events = computed(() => eventsData.value?.events ?? []);
const total = computed(() => eventsData.value?.total ?? 0);

// Watch for errors and display toast notification
watch(error, (newError) => {
  if (newError) {
    toast.add({
      title: "Error",
      description: "Failed to fetch events",
      color: "error",
    });
  }
});

// Watch for pagination changes to refetch data
watch(
  () => [pagination.value.pageIndex, pagination.value.pageSize, rangeRef.value],
  () => {
    fetchEvents();
  },
  { deep: true },
);

// Bot badge component
const BotBadge = {
  template: {
    render() {
      return h("span", { class: "inline-flex items-center gap-1" }, [
        h("span", { class: "text-xs" }, "🤖"),
        h("span", { class: "text-xs font-mono" }, "BOT"),
      ]);
    },
  },
};

const columns: TableColumn<any>[] = [
  {
    accessorKey: "timestamp",
    header: "Time",
  },
  {
    accessorKey: "browserName",
    header: "Browser",
  },
  {
    accessorKey: "osName",
    header: "OS",
  },
  {
    accessorKey: "deviceType",
    header: "Device",
  },
  {
    accessorKey: "country",
    header: "Country",
  },
  {
    accessorKey: "city",
    header: "City",
  },
  {
    accessorKey: "isp",
    header: "ISP",
  },
  {
    accessorKey: "utmSource",
    header: "UTM Source",
  },
  {
    accessorKey: "utmMedium",
    header: "UTM Medium",
  },
  {
    accessorKey: "utmCampaign",
    header: "UTM Campaign",
  },
];
</script>

<template>
  <div v-if="link" class="flex flex-col gap-4 flex-1">
    <!-- Search and Controls -->
    <div class="flex flex-wrap items-center justify-between gap-4">
      <UInput
        v-model="globalFilter"
        class="max-w-sm"
        icon="i-lucide-search"
        placeholder="Search events..."
      />

      <div class="flex flex-wrap items-center gap-2">
        <USelect
          v-model="pagination.pageSize"
          :items="[
            { label: '25 per page', value: 25 },
            { label: '50 per page', value: 50 },
            { label: '100 per page', value: 100 },
            { label: '200 per page', value: 200 },
          ]"
          class="min-w-32"
        />
      </div>
    </div>

    <!-- Table Container -->
    <div class="flex-1">
      <UTable
        ref="table"
        v-model:global-filter="globalFilter"
        v-model:column-visibility="columnVisibility"
        v-model:row-selection="rowSelection"
        v-model:pagination="pagination"
        :pagination-options="{
          getPaginationRowModel: getPaginationRowModel(),
        }"
        :data="events"
        :columns="columns"
        :loading="loading"
        :ui="{
          base: 'table-fixed border-separate border-spacing-0',
          thead: '[&>tr]:bg-muted/50 [&>tr]:after:content-none',
          tbody: '[&>tr]:last:[&>td]:border-b-0',
          th: 'py-2 first:rounded-l-lg last:rounded-r-lg border-y border-default first:border-l last:border-r',
          td: 'border-b border-default',
        }"
      >
        <template #timestamp-cell="{ row }">
          <span class="font-mono text-sm">
            {{ formatDate(row.getValue("timestamp")) }}
          </span>
        </template>

        <template #browserName-cell="{ row }">
          <div class="flex items-center gap-2">
            <span>{{ row.getValue("browserName") }}</span>
            <UBadge v-if="row.original.isBot === 1" variant="subtle" color="neutral">
              <BotBadge />
            </UBadge>
          </div>
        </template>

        <template #osName-cell="{ row }">
          <span class="text-sm">{{ row.getValue("osName") }}</span>
        </template>

        <template #deviceType-cell="{ row }">
          <span class="text-sm capitalize">{{ row.getValue("deviceType") }}</span>
        </template>

        <template #country-cell="{ row }">
          <span class="text-sm">{{ row.getValue("country") }}</span>
        </template>

        <template #city-cell="{ row }">
          <span class="text-sm">{{ row.getValue("city") }}</span>
        </template>

        <template #isp-cell="{ row }">
          <span class="text-sm text-muted-foreground">{{ row.getValue("isp") }}</span>
        </template>

        <template #utmSource-cell="{ row }">
          <span v-if="row.getValue('utmSource')" class="text-xs font-mono">
            {{ row.getValue("utmSource") }}
          </span>
          <span v-else class="text-sm text-muted-foreground">-</span>
        </template>

        <template #utmMedium-cell="{ row }">
          <span v-if="row.getValue('utmMedium')" class="text-xs font-mono">
            {{ row.getValue("utmMedium") }}
          </span>
          <span v-else class="text-sm text-muted-foreground">-</span>
        </template>

        <template #utmCampaign-cell="{ row }">
          <span v-if="row.getValue('utmCampaign')" class="text-xs">
            {{ row.getValue("utmCampaign") }}
          </span>
          <span v-else class="text-sm text-muted-foreground">-</span>
        </template>
      </UTable>
    </div>

    <!-- Pagination Footer -->
    <div class="flex items-center justify-between gap-3 border-t border-default pt-4 mt-auto">
      <div class="text-sm text-muted-foreground">
        Showing
        {{ table?.tableApi?.getFilteredRowModel().rows.length ?? 0 }} of {{ total }} events
      </div>

      <div class="flex items-center gap-1.5">
        <UPagination
          :default-page="(table?.tableApi?.getState().pagination.pageIndex ?? 0) + 1"
          :items-per-page="table?.tableApi?.getState().pagination.pageSize"
          :total="table?.tableApi?.getFilteredRowModel().rows.length ?? 0"
          @update:page="(p: number) => table?.tableApi?.setPageIndex(p - 1)"
        />
      </div>
    </div>
  </div>
</template>

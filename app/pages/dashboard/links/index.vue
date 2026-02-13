<script setup lang="ts">
import type { TableColumn } from "@nuxt/ui";
import type { Link } from "~~/shared/types/link";
import { getPaginationRowModel } from "@tanstack/table-core";

definePageMeta({
  layout: "dashboard",
  title: "Links - Dashboard - JumpStats",
});

const table = useTemplateRef("table");
const globalFilter = ref("");
const columnVisibility = ref();
const rowSelection = ref({});

const pagination = ref({
  pageIndex: 0,
  pageSize: 10,
});

const toast = useToast();
const { $authClient } = useNuxtApp();
const config = useRuntimeConfig();

async function copyToClipboard(shortCode: string) {
  try {
    const baseUrl = config.public.appUrl || window.location.origin;
    const url = `${baseUrl}/s/${shortCode}`;
    await navigator.clipboard.writeText(url);
    toast.add({
      title: "Success",
      description: "Link copied to clipboard",
      color: "success",
    });
  } catch (error) {
    toast.add({
      title: "Error",
      description: "Failed to copy link",
      color: "error",
    });
  }
}

// Fetch data using useAsyncData with SSR support and automatic caching
const {
  data: linksData,
  pending: loading,
  refresh: fetchLinks,
  error,
} = await useAsyncData(
  "links",
  async () => {
    const result = await $authClient.link.list({
      query: {},
    });
    return result.data;
  },
  {
    transform: (data) => ({
      links: data?.links ?? [],
      total: data?.total ?? 0,
    }),
  },
);

const links = computed(() => linksData.value?.links ?? []);
const total = computed(() => linksData.value?.total ?? 0);

// Watch for errors and display toast notification
watch(error, (newError) => {
  if (newError) {
    toast.add({
      title: "Error",
      description: "Failed to fetch links",
      color: "error",
    });
  }
});

const columns: TableColumn<Link>[] = [
  {
    accessorKey: "title",
    header: "Title",
  },
  {
    accessorKey: "shortCode",
    header: "Short Code",
  },
  {
    accessorKey: "originalUrl",
    header: "Destination URL",
  },
  {
    accessorKey: "status",
    header: "Status",
  },
  {
    accessorKey: "actions",
    header: "Actions",
  },
];
</script>

<template>
  <UDashboardPanel id="links">
    <template #header>
      <UDashboardNavbar title="Links">
        <template #leading>
          <UDashboardSidebarCollapse />
        </template>
      </UDashboardNavbar>
    </template>

    <template #body>
      <div class="flex flex-col gap-4 flex-1">
        <!-- Search and Controls -->
        <div class="flex flex-wrap items-center justify-between gap-4">
          <UInput
            v-model="globalFilter"
            class="max-w-sm"
            icon="i-lucide-search"
            placeholder="Search by title, short code, or URL..."
          />

          <div class="flex flex-wrap items-center gap-2">
            <UButton to="/dashboard/links/create" label="Add Link">
              <template #leading>
                <UIcon name="i-lucide-plus" />
              </template>
            </UButton>

            <USelect
              v-model="pagination.pageSize"
              :items="[
                { label: '10 per page', value: 10 },
                { label: '25 per page', value: 25 },
                { label: '50 per page', value: 50 },
                { label: '100 per page', value: 100 },
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
            :data="links"
            :columns="columns"
            :loading="loading"
            :ui="{
              base: 'table-fixed border-separate border-spacing-0',
              thead: '[&>tr]:bg-elevated/50 [&>tr]:after:content-none',
              tbody: '[&>tr]:last:[&>td]:border-b-0',
              th: 'py-2 first:rounded-l-lg last:rounded-r-lg border-y border-default first:border-l last:border-r',
              td: 'border-b border-default',
            }"
          >
            <template #shortCode-cell="{ row }">
              <span class="font-mono text-sm">{{ row.getValue("shortCode") }}</span>
            </template>

            <template #title-cell="{ row }">
              <span class="text-sm font-medium">
                {{ row.getValue("title") || row.getValue("shortCode") }}
              </span>
            </template>

            <template #originalUrl-cell="{ row }">
              <span class="text-sm truncate block max-w-md">
                {{ row.getValue("originalUrl") }}
              </span>
            </template>

            <template #status-cell="{ row }">
              <UBadge
                :color="row.getValue('status') === 'active' ? 'success' : 'neutral'"
                variant="subtle"
              >
                {{ row.getValue("status") }}
              </UBadge>
            </template>

            <template #actions-cell="{ row }">
              <div class="flex items-center gap-2">
                <UButton
                  :to="`/dashboard/links/${(row.original as Link).id}`"
                  variant="ghost"
                  icon="i-lucide-eye"
                  title="View Details"
                />

                <DashboardLinksEditModal :link="row.original as Link" @refresh="fetchLinks">
                  <UButton variant="ghost" icon="i-lucide-edit" title="Quick Edit" />
                </DashboardLinksEditModal>

                <UButton
                  variant="ghost"
                  icon="i-lucide-copy"
                  title="Copy Link"
                  @click="copyToClipboard((row.original as Link).shortCode)"
                />

                <DashboardLinksDeleteModal :link="row.original as Link" @refresh="fetchLinks">
                  <UButton
                    variant="ghost"
                    icon="i-lucide-trash"
                    color="error"
                    title="Delete Link"
                  />
                </DashboardLinksDeleteModal>
              </div>
            </template>
          </UTable>
        </div>

        <!-- Pagination Footer -->
        <div class="flex items-center justify-between gap-3 border-t border-default pt-4 mt-auto">
          <div class="text-sm text-muted-foreground">
            Showing
            {{ table?.tableApi?.getFilteredRowModel().rows.length ?? 0 }} of {{ total }} links
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
  </UDashboardPanel>
</template>

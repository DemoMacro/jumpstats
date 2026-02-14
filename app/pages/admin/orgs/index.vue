<script setup lang="ts">
import type { TableColumn } from "@nuxt/ui";
import type { Organization } from "better-auth/plugins";
import { getPaginationRowModel } from "@tanstack/table-core";
import { authClient } from "~/utils/auth";

definePageMeta({
  layout: "dashboard",
  title: "Organizations - Admin - JumpStats",
});

// Page state
const loading = ref(false);
const organizations = ref<Organization[]>([]);
const total = ref(0);
const searchValue = ref("");

// Table state
const table = useTemplateRef("table");
const columnFilters = ref([
  {
    id: "name",
    value: "",
  },
]);
const columnVisibility = ref();
const rowSelection = ref({});

const pagination = ref({
  pageIndex: 0,
  pageSize: 10,
});

const toast = useToast();

// Fetch organizations
async function fetchOrganizations() {
  loading.value = true;
  try {
    const result = await authClient.organization.list({
      query: {
        limit: pagination.value.pageSize,
        offset: pagination.value.pageIndex * pagination.value.pageSize,
        searchValue: searchValue.value || undefined,
        sortBy: "name",
      },
    });

    if (result.data) {
      organizations.value = result.data;
      total.value = result.data.length;
    }
  } catch (error) {
    toast.add({
      title: "Error",
      description: "Failed to fetch organizations",
      color: "error",
    });
  } finally {
    loading.value = false;
  }
}

// Watch for search changes
watch(
  () => columnFilters.value[0]?.value,
  () => {
    fetchOrganizations();
  },
);

// Watch for pagination changes
watch(
  pagination,
  () => {
    fetchOrganizations();
  },
  { deep: true },
);

// Load data on mount
onMounted(() => {
  fetchOrganizations();
});

// Table columns
const columns: TableColumn<Organization>[] = [
  {
    accessorKey: "name",
    header: "Name",
  },
  {
    accessorKey: "slug",
    header: "Slug",
  },
  {
    accessorKey: "createdAt",
    header: "Created",
  },
  {
    accessorKey: "actions",
    header: "Actions",
  },
];
</script>

<template>
  <UDashboardPanel id="organizations">
    <template #header>
      <UDashboardNavbar title="Organizations">
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
            :model-value="table?.tableApi?.getColumn('name')?.getFilterValue() as string"
            class="max-w-sm"
            icon="i-lucide-search"
            placeholder="Filter organizations..."
            @update:model-value="table?.tableApi?.getColumn('name')?.setFilterValue($event)"
          />

          <div class="flex flex-wrap items-center gap-2">
            <UButton to="/admin/orgs/create" label="Add Organization">
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
            v-model:column-filters="columnFilters"
            v-model:column-visibility="columnVisibility"
            v-model:row-selection="rowSelection"
            v-model:pagination="pagination"
            :pagination-options="{
              getPaginationRowModel: getPaginationRowModel(),
            }"
            :data="organizations"
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
            <template #name-cell="{ row }">
              <span class="font-medium">{{ row.getValue("name") }}</span>
            </template>

            <template #slug-cell="{ row }">
              <span class="font-mono text-sm">{{ row.getValue("slug") }}</span>
            </template>

            <template #createdAt-cell="{ row }">
              <span class="text-sm text-muted-foreground">
                {{ new Date(row.getValue("createdAt")).toLocaleDateString() }}
              </span>
            </template>

            <template #actions-cell="{ row }">
              <div class="flex items-center gap-2">
                <!-- View Details -->
                <UButton
                  :to="`/admin/orgs/${row.original.id}`"
                  variant="ghost"
                  icon="i-lucide-eye"
                  title="View Details"
                />

                <!-- Manage Members -->
                <UButton
                  :to="`/admin/orgs/${row.original.id}/members`"
                  variant="ghost"
                  icon="i-lucide-users"
                  title="Manage Members"
                />

                <!-- Security Settings -->
                <UButton
                  :to="`/admin/orgs/${row.original.id}/security`"
                  variant="ghost"
                  icon="i-lucide-shield"
                  title="Security Settings"
                />

                <!-- Delete (Keep as Modal for dangerous action) -->
                <AdminOrgsDeleteModal :organization="row.original" @refresh="fetchOrganizations">
                  <UButton
                    variant="ghost"
                    icon="i-lucide-trash"
                    color="error"
                    title="Delete Organization"
                  />
                </AdminOrgsDeleteModal>
              </div>
            </template>
          </UTable>
        </div>

        <!-- Pagination Footer -->
        <div class="flex items-center justify-between gap-3 border-t border-default pt-4 mt-auto">
          <div class="text-sm text-muted-foreground">
            Showing {{ organizations.length }} of {{ total }} organizations
          </div>

          <div class="flex items-center gap-1.5">
            <UPagination
              :default-page="(table?.tableApi?.getState().pagination.pageIndex ?? 0) + 1"
              :items-per-page="table?.tableApi?.getState().pagination.pageSize"
              :total="total"
              @update:page="(p: number) => table?.tableApi?.setPageIndex(p - 1)"
            />
          </div>
        </div>
      </div>
    </template>
  </UDashboardPanel>
</template>

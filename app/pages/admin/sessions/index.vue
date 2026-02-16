<script setup lang="ts">
import type { TableColumn } from "@nuxt/ui";
import { getPaginationRowModel } from "@tanstack/table-core";

definePageMeta({
  layout: "dashboard",
  title: "Sessions - Admin - JumpStats",
});

// Table state
const table = useTemplateRef("table");
const columnFilters = ref([
  {
    id: "userEmail",
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

const searchValue = ref("");

// Use composable for session data with reactive search
const { sessions, loading, fetchSessions, revokeUserSessions } = useAdminSessions(searchValue);

const total = computed(() => sessions.value.length);

// Watch for search changes - sync search input with searchValue
watch(
  () => columnFilters.value[0]?.value,
  (newValue) => {
    searchValue.value = newValue || "";
  },
);

// Table columns
const columns: TableColumn<any>[] = [
  {
    accessorKey: "userEmail",
    header: "User",
  },
  {
    accessorKey: "role",
    header: "Role",
  },
  {
    accessorKey: "token",
    header: "Token",
  },
  {
    accessorKey: "ipAddress",
    header: "IP Address",
  },
  {
    accessorKey: "userAgent",
    header: "User Agent",
  },
  {
    accessorKey: "createdAt",
    header: "Created",
  },
  {
    accessorKey: "expiresAt",
    header: "Expires",
  },
  {
    accessorKey: "actions",
    header: "Actions",
  },
];

// Get session status
function getSessionStatus(expiresAt: string) {
  const expiry = new Date(expiresAt);
  const now = new Date();
  return expiry > now ? "active" : "expired";
}

// Handle session revocation
async function handleRevokeSession(session: any) {
  try {
    await revokeUserSessions(session.userId);

    toast.add({
      title: "Success",
      description: "Sessions revoked successfully",
      color: "success",
    });
  } catch (err) {
    toast.add({
      title: "Error",
      description: err instanceof Error ? err.message : "Failed to revoke sessions",
      color: "error",
    });
  }
}
</script>

<template>
  <UDashboardPanel id="sessions">
    <template #header>
      <UDashboardNavbar title="Sessions">
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
            :model-value="table?.tableApi?.getColumn('userEmail')?.getFilterValue() as string"
            class="max-w-sm"
            icon="i-lucide-search"
            placeholder="Filter users..."
            @update:model-value="table?.tableApi?.getColumn('userEmail')?.setFilterValue($event)"
          />

          <div class="flex flex-wrap items-center gap-2">
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
            :data="sessions"
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
            <template #userEmail-cell="{ row }">
              <div class="flex items-center gap-2">
                <div class="size-6 bg-primary/10 rounded-full flex items-center justify-center">
                  <UIcon name="i-lucide-user" class="size-3 text-primary" />
                </div>
                <div>
                  <div class="font-medium">{{ row.getValue("userEmail") }}</div>
                  <div class="text-xs text-muted-foreground">
                    {{ row.original.userName || "—" }}
                  </div>
                </div>
              </div>
            </template>

            <template #role-cell="{ row }">
              <UBadge
                :color="row.getValue('role') === 'admin' ? 'primary' : 'neutral'"
                variant="soft"
              >
                {{ row.getValue("role") || "—" }}
              </UBadge>
            </template>

            <template #token-cell="{ row }">
              <code class="text-xs bg-muted px-2 py-1 rounded">
                {{ row.getValue("token") || "—" }}
              </code>
            </template>

            <template #ipAddress-cell="{ row }">
              <span class="text-sm text-muted-foreground font-mono">
                {{ row.getValue("ipAddress") || "—" }}
              </span>
            </template>

            <template #userAgent-cell="{ row }">
              <span class="text-sm text-muted-foreground max-w-xs truncate block">
                {{ row.getValue("userAgent") || "—" }}
              </span>
            </template>

            <template #createdAt-cell="{ row }">
              <span class="text-sm text-muted-foreground">
                {{ new Date(row.getValue("createdAt")).toLocaleDateString() }}
              </span>
            </template>

            <template #expiresAt-cell="{ row }">
              <span class="text-sm text-muted-foreground">
                {{ new Date(row.getValue("expiresAt")).toLocaleDateString() }}
              </span>
            </template>

            <template #actions-cell="{ row }">
              <div class="flex items-center gap-2">
                <!-- View User Details -->
                <UButton
                  :to="`/admin/users/${row.original.userId}`"
                  variant="ghost"
                  icon="i-lucide-eye"
                  title="View User"
                />

                <!-- Revoke User Sessions -->
                <UButton
                  variant="ghost"
                  icon="i-lucide-power"
                  color="error"
                  title="Revoke All User Sessions"
                  :disabled="getSessionStatus(row.getValue('expiresAt')) === 'expired'"
                  @click="handleRevokeSession(row.original)"
                />
              </div>
            </template>
          </UTable>
        </div>

        <!-- Pagination Footer -->
        <div class="flex items-center justify-between gap-3 border-t border-default pt-4 mt-auto">
          <div class="text-sm text-muted-foreground">
            Showing {{ sessions.length }} of {{ total }} sessions
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

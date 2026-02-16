<script setup lang="ts">
import type { UserWithRole } from "better-auth/plugins";
import type { TableColumn } from "@nuxt/ui";
import { getPaginationRowModel } from "@tanstack/table-core";
import { authClient } from "~/utils/auth";

definePageMeta({
  layout: "dashboard",
  title: "Users - Admin - JumpStats",
});

// Page state
const loading = ref(false);
const users = ref<UserWithRole[]>([]);
const total = ref(0);
const searchValue = ref("");

// Table state
const table = useTemplateRef("table");
const columnFilters = ref([
  {
    id: "email",
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

// Fetch users
async function fetchUsers() {
  loading.value = true;
  try {
    const result = await authClient.admin.listUsers({
      query: {
        limit: pagination.value.pageSize,
        offset: pagination.value.pageIndex * pagination.value.pageSize,
        searchValue: searchValue.value || undefined,
        sortBy: "role",
      },
    });

    if (result.data) {
      users.value = result.data.users;
      total.value = result.data.total;
    }
  } catch (error) {
    toast.add({
      title: "Error",
      description: "Failed to fetch users",
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
    fetchUsers();
  },
);

// Watch for pagination changes
watch(
  pagination,
  () => {
    fetchUsers();
  },
  { deep: true },
);

// Load data on mount
onMounted(() => {
  fetchUsers();
});

// Table columns
const columns: TableColumn<UserWithRole>[] = [
  {
    accessorKey: "email",
    header: "Email",
  },
  {
    accessorKey: "name",
    header: "Name",
  },
  {
    accessorKey: "image",
    header: "Avatar",
  },
  {
    accessorKey: "emailVerified",
    header: "Verified",
  },
  {
    accessorKey: "role",
    header: "Role",
  },
  {
    accessorKey: "banned",
    header: "Status",
  },
  {
    accessorKey: "createdAt",
    header: "Created",
  },
  {
    accessorKey: "updatedAt",
    header: "Updated",
  },
  {
    accessorKey: "actions",
    header: "Actions",
  },
];
</script>

<template>
  <UDashboardPanel id="users">
    <template #header>
      <UDashboardNavbar title="Users">
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
            :model-value="table?.tableApi?.getColumn('email')?.getFilterValue() as string"
            class="max-w-sm"
            icon="i-lucide-search"
            placeholder="Filter emails..."
            @update:model-value="table?.tableApi?.getColumn('email')?.setFilterValue($event)"
          />

          <div class="flex flex-wrap items-center gap-2">
            <UButton to="/admin/users/create" label="Add User">
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
            :data="users"
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
            <template #email-cell="{ row }">
              <span class="font-medium">{{ row.getValue("email") }}</span>
            </template>

            <template #name-cell="{ row }">
              <span>{{ row.getValue("name") || "—" }}</span>
            </template>

            <template #image-cell="{ row }">
              <UAvatar
                v-if="row.getValue('image')"
                :src="row.getValue('image')"
                :alt="row.getValue('name')"
                size="sm"
              />
              <div
                v-else
                class="size-8 bg-primary/10 rounded-full flex items-center justify-center"
              >
                <UIcon name="i-lucide-user" class="size-4 text-primary" />
              </div>
            </template>

            <template #emailVerified-cell="{ row }">
              <UBadge
                :color="row.getValue('emailVerified') ? 'success' : 'warning'"
                variant="soft"
                size="sm"
              >
                {{ row.getValue("emailVerified") ? "Verified" : "Not Verified" }}
              </UBadge>
            </template>

            <template #role-cell="{ row }">
              <UBadge
                :color="row.getValue('role') === 'admin' ? 'primary' : 'neutral'"
                variant="soft"
              >
                {{ row.getValue("role") || "user" }}
              </UBadge>
            </template>

            <template #banned-cell="{ row }">
              <div v-if="row.getValue('banned')" class="space-y-1">
                <UBadge color="error" variant="soft" size="sm"> Banned </UBadge>
                <div v-if="row.getValue('banReason')" class="text-xs text-muted-foreground">
                  {{ row.getValue("banReason") }}
                </div>
                <div v-if="row.getValue('banExpires')" class="text-xs text-muted-foreground">
                  Expires:
                  {{ new Date(row.getValue("banExpires")).toLocaleDateString() }}
                </div>
              </div>
              <UBadge v-else color="success" variant="soft" size="sm"> Active </UBadge>
            </template>

            <template #createdAt-cell="{ row }">
              <span class="text-sm text-muted-foreground">
                {{ new Date(row.getValue("createdAt")).toLocaleDateString() }}
              </span>
            </template>

            <template #updatedAt-cell="{ row }">
              <span class="text-sm text-muted-foreground">
                {{ new Date(row.getValue("updatedAt")).toLocaleDateString() }}
              </span>
            </template>

            <template #actions-cell="{ row }">
              <div class="flex items-center gap-2">
                <!-- View Details -->
                <UButton
                  :to="`/admin/users/${row.original.id}`"
                  variant="ghost"
                  icon="i-lucide-eye"
                  title="View Details"
                />

                <!-- Security Settings -->
                <UButton
                  :to="`/admin/users/${row.original.id}/security`"
                  variant="ghost"
                  icon="i-lucide-shield"
                  title="Security Settings"
                />

                <!-- Delete (Keep as Modal for dangerous action) -->
                <DashboardUserDeleteModal :user="row.original" @refresh="fetchUsers">
                  <UButton
                    variant="ghost"
                    icon="i-lucide-trash"
                    color="error"
                    title="Delete User"
                  />
                </DashboardUserDeleteModal>
              </div>
            </template>
          </UTable>
        </div>

        <!-- Pagination Footer -->
        <div class="flex items-center justify-between gap-3 border-t border-default pt-4 mt-auto">
          <div class="text-sm text-muted-foreground">
            Showing {{ users.length }} of {{ total }} users
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

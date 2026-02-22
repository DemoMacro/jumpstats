<script setup lang="ts">
import type { TableColumn } from "@nuxt/ui";
import type { Domain } from "~~/shared/types/domain";
import { getPaginationRowModel } from "@tanstack/table-core";
import { authClient } from "~/utils/auth";
import { useDomains } from "~/composables/useDomains";

definePageMeta({
  layout: "dashboard",
  title: "Domains - Dashboard - JS.GS",
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

// Get active organization
const activeOrgResult = authClient.useActiveOrganization();
const activeOrg = computed(() => activeOrgResult.value.data);

async function copyToClipboard(token: string) {
  try {
    await navigator.clipboard.writeText(token);
    toast.add({
      title: "Success",
      description: "Verification token copied to clipboard",
      color: "success",
    });
  } catch {
    toast.add({
      title: "Error",
      description: "Failed to copy token",
      color: "error",
    });
  }
}

// Build query based on pagination and active organization
const query = computed(() => {
  const q: Record<string, any> = {
    limit: pagination.value.pageSize,
    offset: pagination.value.pageIndex * pagination.value.pageSize,
  };
  if (activeOrg.value?.id) {
    q.organizationId = activeOrg.value.id;
  }
  return q;
});

// Fetch domains using composable with watch sources
const {
  domains,
  total,
  loading,
  refresh: fetchDomains,
  error,
} = useDomains(query.value, [
  activeOrg,
  () => pagination.value.pageIndex,
  () => pagination.value.pageSize,
]);

// Watch for errors and display toast notification
watch(error, (newError) => {
  if (newError) {
    toast.add({
      title: "Error",
      description: "Failed to fetch domains",
      color: "error",
    });
  }
});

const columns: TableColumn<Domain>[] = [
  {
    accessorKey: "domainName",
    header: "Domain Name",
  },
  {
    accessorKey: "status",
    header: "Status",
  },
  {
    accessorKey: "verifiedAt",
    header: "Verified",
  },
  {
    accessorKey: "actions",
    header: "Actions",
  },
];
</script>

<template>
  <UDashboardPanel id="domains">
    <template #header>
      <UDashboardNavbar title="Domains">
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
            placeholder="Search by domain name..."
          />

          <div class="flex flex-wrap items-center gap-2">
            <UButton to="/dashboard/domains/create" label="Add Domain">
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
            :data="domains"
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
            <template #domainName-cell="{ row }">
              <span class="font-mono text-sm">
                {{ row.getValue("domainName") }}
              </span>
            </template>

            <template #status-cell="{ row }">
              <UBadge
                :color="
                  row.getValue('status') === 'active'
                    ? 'success'
                    : row.getValue('status') === 'inactive'
                      ? 'error'
                      : 'neutral'
                "
                variant="subtle"
              >
                {{ row.getValue("status") }}
              </UBadge>
            </template>

            <template #verifiedAt-cell="{ row }">
              <span class="text-sm">
                {{
                  (row.original as Domain).verifiedAt
                    ? new Date((row.original as Domain).verifiedAt as Date).toLocaleDateString()
                    : "Not verified"
                }}
              </span>
            </template>

            <template #actions-cell="{ row }">
              <div class="flex items-center gap-2">
                <UButton
                  variant="ghost"
                  icon="i-lucide-copy"
                  title="Copy Verification Token"
                  :disabled="!row.original.verificationToken"
                  @click="copyToClipboard((row.original as Domain).verificationToken || '')"
                />

                <UPopover v-if="row.original.verificationToken">
                  <UButton variant="ghost" icon="i-lucide-info" title="Verification Info" />

                  <template #content>
                    <div class="p-4 max-w-sm">
                      <p class="text-sm font-medium mb-2">DNS Verification</p>
                      <p class="text-sm text-muted-foreground mb-2">
                        Add this TXT record to your domain's DNS configuration:
                      </p>
                      <div class="bg-muted rounded p-3 space-y-1">
                        <div class="flex items-center gap-2">
                          <span class="text-sm font-medium">Type:</span>
                          <UBadge variant="subtle">TXT</UBadge>
                        </div>
                        <div class="flex items-center gap-2">
                          <span class="text-sm font-medium">Host/Name:</span>
                          <span class="text-sm font-mono">@</span>
                          <span class="text-xs text-muted-foreground"
                            >(or {{ row.original.domainName }})</span
                          >
                        </div>
                        <div class="flex items-center gap-2">
                          <span class="text-sm font-medium">Value:</span>
                          <span class="text-sm font-mono break-all">
                            {{ row.original.verificationToken }}
                          </span>
                        </div>
                      </div>
                    </div>
                  </template>
                </UPopover>

                <DashboardDomainVerifyModal
                  v-if="row.original.status === 'pending'"
                  :domain="row.original"
                  @refresh="fetchDomains"
                >
                  <UButton variant="ghost" icon="i-lucide-refresh-cw" title="Verify Domain" />
                </DashboardDomainVerifyModal>

                <DashboardDomainDeleteModal :domain="row.original" @refresh="fetchDomains">
                  <UButton
                    variant="ghost"
                    icon="i-lucide-trash"
                    color="error"
                    title="Delete Domain"
                  />
                </DashboardDomainDeleteModal>
              </div>
            </template>
          </UTable>
        </div>

        <!-- Pagination Footer -->
        <div class="flex items-center justify-between gap-3 border-t border-default pt-4 mt-auto">
          <div class="text-sm text-muted-foreground">
            Showing
            {{ table?.tableApi?.getFilteredRowModel().rows.length ?? 0 }} of {{ total }} domains
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

<script setup lang="ts">
import * as z from "zod";
import type { FormSubmitEvent } from "@nuxt/ui";
import { authClient } from "~/utils/auth";

const route = useRoute();
const linkId = route.params.id as string;

const { link, loading, error, fetchLink } = useLinkDetail(linkId);

const toast = useToast();

const schema = z.object({
  originalUrl: z.string().url("Please enter a valid URL"),
  domainId: z.string().optional(),
  title: z.string().max(200).nullable().optional(),
  description: z.string().max(500).nullable().optional(),
  status: z.enum(["active", "inactive", "expired"]).optional(),
});

type Schema = z.output<typeof schema>;

const state = reactive<Partial<Schema>>({
  originalUrl: undefined,
  domainId: undefined,
  title: undefined,
  description: undefined,
  status: undefined,
});

watch(
  () => link.value,
  (newLink) => {
    if (newLink) {
      state.originalUrl = newLink.originalUrl;
      state.domainId = newLink.domainId || "default";
      state.title = newLink.title;
      state.description = newLink.description;
      state.status = newLink.status;
    }
  },
);

const submitting = ref(false);

async function updateLink(event: FormSubmitEvent<Schema>) {
  submitting.value = true;
  try {
    const result = await authClient.link.update({
      id: linkId,
      originalUrl: event.data.originalUrl!,
      domainId: event.data.domainId === "default" ? null : event.data.domainId || null,
      title: event.data.title || null,
      description: event.data.description || null,
      status: event.data.status,
    });

    if (result.error) {
      toast.add({
        title: "Error",
        description: result.error.message || "Failed to update link",
        color: "error",
      });
      return;
    }

    toast.add({
      title: "Success",
      description: "Link updated successfully",
      color: "success",
    });

    await fetchLink();
  } catch (error) {
    toast.add({
      title: "Error",
      description: "An unexpected error occurred",
      color: "error",
    });
  } finally {
    submitting.value = false;
  }
}
</script>

<template>
  <div v-if="link" class="w-full lg:max-w-2xl mx-auto">
    <UForm id="edit-link" :schema="schema" :state="state" @submit="updateLink">
      <UPageCard
        title="Edit Link"
        description="Update link details and settings"
        variant="naked"
        orientation="horizontal"
        class="mb-4"
      >
        <div class="flex gap-3 ms-auto">
          <UButton variant="outline" :to="`/dashboard/links/${linkId}`" :disabled="submitting">
            Cancel
          </UButton>
          <UButton label="Save Changes" color="primary" type="submit" :loading="submitting">
            <template #leading>
              <UIcon name="i-lucide-save" />
            </template>
          </UButton>
        </div>
      </UPageCard>

      <DashboardLinkForm :schema="schema" :state="state" :submitting="submitting" />
    </UForm>
  </div>
</template>

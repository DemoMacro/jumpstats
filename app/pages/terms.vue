<script setup lang="ts">
definePageMeta({
  layout: "app",
  title: "Terms of Service - JumpStats",
  description:
    "Read our Terms of Service to understand your rights and responsibilities when using JumpStats.",
});

const { locale } = useI18n();

// Fetch all data from the collection
const { data: terms } = await useAsyncData("terms", () => {
  return queryCollection(`content_${locale.value}`)
    .where("stem", "=", `${locale.value}/terms`)
    .first();
});

// Set SEO metadata
if (terms.value) {
  useSeoMeta({
    title: terms.value.title,
    description: terms.value.description,
  });
}
</script>

<template>
  <div class="min-h-screen py-12">
    <UContainer>
      <!-- Header -->
      <div class="mb-8 text-center">
        <h1 class="text-4xl font-bold mb-4">
          {{ terms?.title || "Terms of Service" }}
        </h1>
        <p class="text-lg">
          {{ terms?.description }}
        </p>
        <p v-if="terms?.meta.date" class="text-sm mt-2 opacity-75">
          Last updated: {{ terms.meta.date }}
        </p>
      </div>

      <!-- Content -->
      <div class="max-w-4xl mx-auto">
        <ContentRenderer v-if="terms" :value="terms" />
      </div>

      <!-- Back to Home -->
      <div class="mt-8 text-center">
        <UButton to="/" icon="i-lucide-arrow-left" variant="outline" color="neutral">
          Back to Home
        </UButton>
      </div>
    </UContainer>
  </div>
</template>

<script setup lang="ts">
type Period = "daily" | "weekly" | "monthly";

const model = defineModel<Period>({ required: true });

const items = [
  { label: "Last 7 days", value: "daily" },
  { label: "Last 30 days", value: "weekly" },
  { label: "Last 90 days", value: "monthly" },
];
</script>

<template>
  <USelect
    v-model="model"
    :items="items"
    variant="ghost"
    class="data-[state=open]:bg-elevated"
    :ui="{
      value: 'capitalize',
      itemLabel: 'capitalize',
      trailingIcon: 'group-data-[state=open]:rotate-180 transition-transform duration-200',
    }"
  />
</template>

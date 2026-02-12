import { defineContentConfig, defineCollection } from "@nuxt/content";

export default defineContentConfig({
  collections: {
    content_en: defineCollection({
      type: "page",
      source: "en/*.md",
    }),
    content_zh_cn: defineCollection({
      type: "page",
      source: "zh_cn/*.md",
    }),
  },
});

import { defineNuxtConfig } from "nuxt/config";

export default defineNuxtConfig({
  app: {
    keepalive: true,
  },

  typescript: {
    typeCheck: true,
  },

  routeRules: {
    "/api/**": {
      cors: true,
    },
    "/admin/**": {
      ssr: false,
    },
    "/dashboard/**": {
      ssr: false,
    },
    "/sw.js": {
      ssr: false,
    },
  },

  modules: ["@nuxt/ui", "@vueuse/nuxt", "@nuxtjs/i18n", "@nuxt/content", "nuxt-mcp-dev"],

  css: ["~/assets/css/main.css"],

  content: {
    experimental: { sqliteConnector: "native" },
  },

  i18n: {
    defaultLocale: "en",
    langDir: "locales",
    locales: [
      {
        code: "en",
        language: "en",
        file: "en.json",
        name: "English",
      },
      {
        code: "zh_cn",
        language: "zh_cn",
        file: "zh_cn.json",
        name: "简体中文",
      },
    ],
    detectBrowserLanguage: {
      cookieCrossOrigin: true,
    },
  },
});

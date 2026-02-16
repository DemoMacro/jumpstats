import { defineNuxtConfig } from "nuxt/config";

export default defineNuxtConfig({
  future: {
    compatibilityVersion: 5,
  },

  ssr: false,

  typescript: {
    typeCheck: true,
  },

  routeRules: {
    "/api/**": {
      cors: true,
    },
  },

  nitro: {
    future: {
      nativeSWR: true,
    },
    prerender: {
      routes: ["/", "/privacy", "/terms"],
    },
  },

  modules: ["@nuxt/ui", "@vueuse/nuxt", "@nuxtjs/i18n", "@nuxt/content"],

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
    strategy: "no_prefix",
    skipSettingLocaleOnNavigate: false,
    differentDomains: false,
  },
});

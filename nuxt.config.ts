import { defineNuxtConfig } from "nuxt/config";
import { isDevelopment, env } from "std-env";

export default defineNuxtConfig({
  app: {
    keepalive: true,
  },

  future: {
    compatibilityVersion: 5,
  },

  compatibilityDate: "2026-02-16",

  typescript: {
    typeCheck: isDevelopment ? true : false,
  },

  routeRules: {
    "/api/**": {
      cors: true,
    },
    "/sw.js": {
      ssr: false,
    },
    "/admin/**": {
      ssr: false,
    },
    "/dashboard/**": {
      ssr: false,
    },
  },

  nitro: {
    future: {
      nativeSWR: true,
    },
    rollupConfig: {
      external: ["pg-native", "cloudflare:sockets", "@react-email/render"],
    },
    cloudflare: {
      deployConfig: true,
      nodeCompat: true,
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

  ui: {
    experimental: {
      componentDetection: true,
    },
  },

  hooks: {
    async "build:before"() {
      // Skip migration if explicitly disabled (for Docker builds)
      if (env.SKIP_MIGRATE === "true") {
        console.log("ℹ️ Skipping database migration (SKIP_MIGRATE=true)");
        return;
      }
      const { migrate } = await import("./scripts/migrate");
      await migrate();
    },
  },
});

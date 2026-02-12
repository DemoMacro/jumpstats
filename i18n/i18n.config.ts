import { defineI18nConfig } from "#i18n";

export default defineI18nConfig(() => ({
  legacy: false,
  availableLocales: ["en", "zh_cn"],
  flatJson: true,
  fallbackLocale: "en",
  fallbackWarn: false,
  silentFallbackWarn: true,
  silentTranslationWarn: true,
}));

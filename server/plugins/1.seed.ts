import { createAdminUser, defaultAdminConfig } from "~~/server/utils/auth/seed";

export default defineNitroPlugin(async () => {
  setTimeout(async () => {
    try {
      const result = await createAdminUser(defaultAdminConfig);

      if (result.success) {
        console.log("✅ Admin user initialized successfully");
        console.log(`Email: ${defaultAdminConfig.email}`);
        console.log(`Username: ${defaultAdminConfig.username}`);
      } else {
        console.log("ℹ️ Admin user initialization skipped:", result.message);
      }
    } catch (error) {
      console.error("Failed to initialize admin user:", error);
    }
  }, 1000);
});

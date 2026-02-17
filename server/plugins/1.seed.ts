import { auth } from "~~/server/utils/auth";
import { env } from "std-env";

/**
 * Default admin credentials (for development)
 * In production, these should come from environment variables
 */
const defaultAdminConfig = {
  email: env.ADMIN_EMAIL || "admin@js.gs",
  name: env.ADMIN_NAME || "System Administrator",
  username: env.ADMIN_USERNAME || "admin",
  password: env.ADMIN_PASSWORD || "admin123456",
};

export default defineNitroPlugin(async () => {
  // ==========================================
  // Initialize admin user
  // ==========================================
  try {
    console.log("🔐 Checking admin user...");

    // First, check if an admin user already exists
    const existingUsers = await auth.api.listUsers({
      query: {
        filterField: "role",
        filterValue: "admin",
        filterOperator: "eq",
        limit: 1,
      },
    });

    if (existingUsers?.users && existingUsers.users.length > 0) {
      console.log("ℹ️ Admin user already exists, skipping initialization");
    } else {
      // No admin user exists, create one
      console.log("📝 Creating admin user...");
      const result = await auth.api.createUser({
        body: {
          email: defaultAdminConfig.email,
          name: defaultAdminConfig.name,
          password: defaultAdminConfig.password,
          role: "admin",
          data: {
            username: defaultAdminConfig.username,
            displayUsername: defaultAdminConfig.username,
          },
        },
      });

      if (result?.user) {
        console.log("✅ Admin user initialized successfully");
        console.log(`   Email: ${defaultAdminConfig.email}`);
        console.log(`   Username: ${defaultAdminConfig.username}`);
      } else {
        console.error("❌ Admin user creation failed: No user returned");
      }
    }
  } catch (error) {
    // Check if it's a "user already exists" error
    if (String(error).includes("User already exists")) {
      console.log("ℹ️ Admin user already exists, skipping initialization");
    } else {
      console.error("❌ Failed to initialize admin user:", error);
    }
  }
});

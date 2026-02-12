import { auth } from "./index";

/**
 * Initialize default admin user using admin plugin
 * This should be called during application startup or via a CLI command
 */
export async function createAdminUser(options: {
  email: string;
  name: string;
  username: string;
  password: string;
}): Promise<{ success: boolean; message: string }> {
  try {
    // Create admin user using admin plugin with direct role assignment
    const result = await auth.api.createUser({
      body: {
        email: options.email,
        name: options.name,
        password: options.password,
        role: "admin",
        data: {
          username: options.username,
          displayUsername: options.username,
        },
      },
    });

    if (!result || !result.user) {
      console.error("Admin user creation failed: No user returned");
    }

    return {
      success: true,
      message: "Admin user created successfully",
    };
  } catch (error) {
    return {
      success: false,
      message: `Error creating admin user: ${error instanceof Error ? error.message : "Unknown error"}`,
    };
  }
}

/**
 * Default admin credentials (for development)
 * In production, these should come from environment variables
 */
export const defaultAdminConfig = {
  email: process.env.ADMIN_EMAIL || "admin@js.gs",
  name: process.env.ADMIN_NAME || "System Administrator",
  username: process.env.ADMIN_USERNAME || "admin",
  password: process.env.ADMIN_PASSWORD || "admin123456",
};

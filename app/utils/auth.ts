import { createAuthClient } from "better-auth/vue";
import {
  usernameClient,
  adminClient,
  apiKeyClient,
  organizationClient,
} from "better-auth/client/plugins";
import { linkClient } from "~~/shared/utils/auth/link/client";

export const authClient = createAuthClient({
  basePath: "/api",
  plugins: [usernameClient(), adminClient(), apiKeyClient(), organizationClient(), linkClient()],
});

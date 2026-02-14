import type { BetterAuthClientPlugin } from "better-auth/client";
import type { domain } from ".";

export const domainClient = () => {
  return {
    id: "domain",
    $InferServerPlugin: {} as ReturnType<typeof domain>,
  } satisfies BetterAuthClientPlugin;
};

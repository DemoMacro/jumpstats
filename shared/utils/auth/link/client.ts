import type { BetterAuthClientPlugin } from "better-auth/client";
import type { link } from ".";

export const linkClient = () => {
  return {
    id: "link",
    $InferServerPlugin: {} as ReturnType<typeof link>,
  } satisfies BetterAuthClientPlugin;
};

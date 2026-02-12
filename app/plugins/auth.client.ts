import { authClient } from "~/utils/auth";

export default defineNuxtPlugin(() => {
  return {
    provide: {
      authClient: authClient,
    },
  };
});

export default defineNuxtRouteMiddleware(async (to) => {
  if (import.meta.server) {
    return;
  }

  // Check if user is authenticated for all routes
  const { data: session } = await authClient.useSession(useFetch);

  if (session.value) {
    let attempts = 0;
    const maxAttempts = 10;
    while (session.value && attempts < maxAttempts) {
      await new Promise((resolve) => setTimeout(resolve, 100));
      attempts++;
    }
  }

  // Skip middleware for public routes like landing page
  if (to.path === "/") {
    return;
  }

  // If user is authenticated and trying to access auth pages, redirect to dashboard
  if (session.value?.user && to.path.startsWith("/auth/")) {
    return navigateTo("/dashboard");
  }

  // If user is not authenticated and trying to access protected routes, redirect to sign-in
  if (!session.value?.user && !to.path.startsWith("/auth/")) {
    return navigateTo("/auth/sign-in");
  }
});

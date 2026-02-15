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

  // If user is authenticated and trying to access auth pages, redirect to dashboard
  if (session.value?.user && to.path.startsWith("/auth/")) {
    return navigateTo("/dashboard");
  }

  // Define protected routes that require authentication
  const protectedRoutes = ["/dashboard", "/admin"];

  // Check if current path starts with any protected route
  const isProtectedRoute = protectedRoutes.some((route) => to.path.startsWith(route));

  // If user is not authenticated and trying to access protected routes, redirect to sign-in
  if (!session.value?.user && isProtectedRoute) {
    return navigateTo("/auth/sign-in");
  }
});

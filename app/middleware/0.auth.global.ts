export default defineNuxtRouteMiddleware(async (to) => {
  const toast = useToast();

  // Check if user is authenticated for all routes
  const { data: session } = await authClient.useSession(useFetch);

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
    toast.add({
      title: "Authentication Required",
      description: "Please sign in to access this page.",
      color: "error",
    });
    return navigateTo("/auth/sign-in");
  }

  // Check admin-only routes
  if (to.path.startsWith("/admin")) {
    // Only allow admin users to access admin routes
    if (session.value?.user?.role !== "admin") {
      // Non-admin users trying to access admin routes
      // Redirect to dashboard with a toast message
      toast.add({
        title: "Access Denied",
        description: "You don't have permission to access this page.",
        color: "error",
      });

      return navigateTo("/dashboard");
    }
  }
});

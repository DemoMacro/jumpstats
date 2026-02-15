<script setup lang="ts">
import * as z from "zod";
import type { FormSubmitEvent } from "@nuxt/ui";
import { authClient } from "~/utils/auth";

const toast = useToast();

definePageMeta({
  title: "Sign In - JumpStats",
});

const fields: AuthFormField[] = [
  {
    name: "identifier",
    type: "text",
    label: "Email or Username",
    required: true,
  },
  {
    name: "password",
    label: "Password",
    type: "password",
    required: true,
  },
  {
    name: "rememberMe",
    label: "Remember me",
    type: "checkbox",
  },
];

const schema = z.object({
  identifier: z.string().min(1, "Email or username is required"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  rememberMe: z.boolean().optional(),
});

type Schema = z.output<typeof schema>;

const loading = ref(false);

async function onSubmit(payload: FormSubmitEvent<Schema>) {
  loading.value = true;
  try {
    // Check if identifier is email or username
    const isEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(payload.data.identifier);

    const { data, error } = isEmail
      ? await authClient.signIn.email({
          email: payload.data.identifier,
          password: payload.data.password,
          rememberMe: payload.data.rememberMe,
          callbackURL: "/dashboard",
        })
      : await authClient.signIn.username({
          username: payload.data.identifier,
          password: payload.data.password,
          rememberMe: payload.data.rememberMe,
          callbackURL: "/dashboard",
        });

    if (error) {
      // Handle email verification required error (403)
      if (error.status === 403) {
        toast.add({
          title: "Email Verification Required",
          description:
            "Please verify your email address. We've sent a verification link to your email.",
          color: "warning",
        });
        return;
      }

      toast.add({
        title: "Sign In Error",
        description: error.message || "Invalid credentials",
        color: "error",
      });
      return;
    }

    // Refresh session after successful sign in
    if (data) {
      await authClient.getSession();

      await navigateTo("/dashboard", { replace: true });
    }

    toast.add({
      title: "Welcome Back!",
      description: "Successfully signed in",
      color: "success",
    });
  } catch (error) {
    toast.add({
      title: "Sign In Error",
      description: "An unexpected error occurred",
      color: "error",
    });
  } finally {
    loading.value = false;
  }
}
</script>

<template>
  <div class="flex min-h-screen items-center justify-center bg-background px-4 py-12">
    <UPageCard class="w-full max-w-md">
      <UAuthForm
        :schema="schema"
        title="Sign In"
        description="Enter your credentials to access your account"
        icon="i-lucide-user"
        :fields="fields"
        :submit="{
          label: 'Sign In',
          loading,
          block: true,
        }"
        @submit="onSubmit"
      >
        <template #description>
          Don't have an account?
          <ULink to="/auth/sign-up" class="text-primary font-medium"> Sign up </ULink>.
        </template>

        <template #password-hint>
          <div class="flex justify-between w-full">
            <ULink to="/auth/forgot-password" class="text-primary font-medium">
              Forgot password?
            </ULink>
            <ULink to="/auth/verify-email" class="text-primary font-medium">
              Resend verification
            </ULink>
          </div>
        </template>

        <template #validation>
          <div id="error-message" />
        </template>
      </UAuthForm>
    </UPageCard>
  </div>
</template>

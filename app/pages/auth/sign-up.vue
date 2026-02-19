<script setup lang="ts">
import * as z from "zod";
import type { FormSubmitEvent } from "@nuxt/ui";
import { authClient } from "~/utils/auth";

const toast = useToast();

definePageMeta({
  title: "Sign Up - JumpStats",
});

const fields: AuthFormField[] = [
  {
    name: "name",
    type: "text",
    label: "Full Name",
    required: true,
  },
  {
    name: "username",
    type: "text",
    label: "Username",
    required: true,
  },
  {
    name: "email",
    type: "email",
    label: "Email",
    required: true,
  },
  {
    name: "password",
    label: "Password",
    type: "password",
    required: true,
  },
  {
    name: "confirmPassword",
    label: "Confirm Password",
    type: "password",
    required: true,
  },
  {
    name: "terms",
    label: "I agree to the Terms of Service and Privacy Policy",
    type: "checkbox",
    required: true,
  },
];

const schema = z
  .object({
    name: z.string().min(2, "Name must be at least 2 characters"),
    username: z
      .string()
      .min(5, "Username must be at least 5 characters")
      .max(30, "Username must be at most 30 characters")
      .regex(
        /^[a-zA-Z0-9_-]+$/,
        "Username can only contain letters, numbers, underscores, and hyphens",
      ),
    email: z.string().email("Invalid email address"),
    password: z.string().min(8, "Password must be at least 8 characters"),
    confirmPassword: z.string(),
    terms: z.boolean().refine((val) => val === true, "You must agree to the terms"),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ["confirmPassword"],
  });

type Schema = z.output<typeof schema>;

const loading = ref(false);

async function onSubmit(payload: FormSubmitEvent<Schema>) {
  loading.value = true;
  try {
    const { data, error } = await authClient.signUp.email({
      name: payload.data.name,
      username: payload.data.username,
      email: payload.data.email,
      password: payload.data.password,
    });

    if (error) {
      toast.add({
        title: "Sign Up Error",
        description: error.message || "Failed to create account",
        color: "error",
      });
      return;
    }

    toast.add({
      title: "Account Created!",
      description:
        "Please check your email and click the verification link to activate your account.",
      color: "success",
    });

    // Redirect to sign-in page
    await navigateTo("/auth/sign-in");
  } catch (error) {
    toast.add({
      title: "Sign Up Error",
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
        title="Sign Up"
        description="Create your account to get started"
        icon="i-lucide-user-plus"
        :fields="fields"
        :submit="{
          label: 'Create Account',
          loading,
          block: true,
        }"
        @submit="onSubmit"
      >
        <template #description>
          Already have an account?
          <ULink to="/auth/sign-in" class="text-primary font-medium"> Sign in </ULink>.
        </template>

        <template #password-hint>
          <p class="text-sm text-muted">Must be at least 8 characters</p>
        </template>

        <template #validation>
          <div id="error-message" />
        </template>

        <template #footer>
          <p class="text-sm text-muted text-center">
            By creating an account, you agree to our
            <ULink to="/terms" class="text-primary font-medium"> Terms of Service </ULink>
            and
            <ULink to="/privacy" class="text-primary font-medium"> Privacy Policy </ULink>.
          </p>
        </template>
      </UAuthForm>
    </UPageCard>
  </div>
</template>

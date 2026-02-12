<script setup lang="ts">
import * as z from "zod";
import type { FormSubmitEvent } from "@nuxt/ui";

const toast = useToast();
const loading = ref(false);
const emailSent = ref(false);

definePageMeta({
  title: "Forgot Password - JumpStats",
});

const fields: AuthFormField[] = [
  {
    name: "email",
    type: "email",
    label: "Email Address",
    required: true,
  },
];

const schema = z.object({
  email: z.email("Please enter a valid email address"),
});

type Schema = z.output<typeof schema>;

async function onSubmit(payload: FormSubmitEvent<Schema>) {
  loading.value = true;
  try {
    const { $authClient } = useNuxtApp();

    const result = await $authClient.requestPasswordReset({
      email: payload.data.email,
      redirectTo: "/auth/sign-in",
    });

    if (result.error) {
      toast.add({
        title: "Error",
        description: result.error.message || "Failed to send reset email",
        color: "error",
      });
      return;
    }

    emailSent.value = true;
    toast.add({
      title: "Email Sent",
      description: "If an account exists with this email, you will receive a password reset link",
      color: "success",
    });
  } catch (error) {
    toast.add({
      title: "Error",
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
      <template v-if="!emailSent">
        <UAuthForm
          :schema="schema"
          :fields="fields"
          title="Forgot Password"
          description="Enter your email address and we'll send you a link to reset your password"
          icon="i-lucide-mail"
          :submit="{
            label: 'Send Reset Link',
            loading,
            block: true,
          }"
          @submit="onSubmit"
        >
          <template #description>
            Remember your password?
            <ULink to="/auth/sign-in" class="text-primary font-medium"> Sign in </ULink>
          </template>

          <template #validation>
            <div id="error-message" />
          </template>
        </UAuthForm>
      </template>

      <template v-else>
        <div class="text-center space-y-6">
          <div class="flex justify-center">
            <UIcon name="i-lucide-mail-check" class="size-16 text-primary" />
          </div>
          <div class="space-y-2">
            <h2 class="text-2xl font-semibold">Check Your Email</h2>
            <p class="text-muted">
              We've sent a password reset link to your email address. Please check your inbox and
              spam folder.
            </p>
          </div>
          <div class="space-y-4">
            <p class="text-sm text-muted">
              Didn't receive the email? Click the button below to resend.
            </p>
            <UButton label="Resend Email" variant="outline" block @click="emailSent = false" />
          </div>
          <div class="pt-4 border-t">
            <ULink to="/auth/sign-in" class="text-primary font-medium"> Back to Sign In </ULink>
          </div>
        </div>
      </template>
    </UPageCard>
  </div>
</template>

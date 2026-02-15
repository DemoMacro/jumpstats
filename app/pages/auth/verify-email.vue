<script setup lang="ts">
import * as z from "zod";
import type { FormSubmitEvent } from "@nuxt/ui";
import { authClient } from "~/utils/auth";

const toast = useToast();

definePageMeta({
  title: "Verify Email - JumpStats",
});

const schema = z.object({
  email: z.string().email("Invalid email address"),
});

type Schema = z.output<typeof schema>;

const loading = ref(false);

async function onSubmit(payload: FormSubmitEvent<Schema>) {
  loading.value = true;
  try {
    const { error } = await authClient.sendVerificationEmail({
      email: payload.data.email,
    });

    if (error) {
      toast.add({
        title: "Send Verification Email Error",
        description: error.message || "Failed to send verification email",
        color: "error",
      });
      return;
    }

    toast.add({
      title: "Verification Email Sent",
      description: "Please check your inbox for the verification link",
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
      <UAuthForm
        :schema="schema"
        title="Verify Your Email"
        description="Enter your email address to receive a verification link"
        icon="i-lucide-mail"
        :fields="[
          {
            name: 'email',
            type: 'email',
            label: 'Email',
            required: true,
          },
        ]"
        :submit="{
          label: 'Send Verification Email',
          loading,
          block: true,
        }"
        @submit="onSubmit"
      >
        <template #footer>
          <div class="text-center text-sm text-muted">
            <p>Already verified?</p>
            <ULink to="/auth/sign-in" class="text-primary font-medium"> Sign In </ULink>
          </div>
        </template>
      </UAuthForm>
    </UPageCard>
  </div>
</template>

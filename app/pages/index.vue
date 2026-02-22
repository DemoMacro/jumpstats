<script setup lang="ts">
import * as z from "zod";
import { authClient } from "~/utils/auth";

definePageMeta({
  layout: "app",
  title: "JS.GS - Shorten Your Links",
  description:
    "Transform long URLs into short, memorable links with powerful analytics and tracking.",
});

const toast = useToast();

// Get current user session
const { data: session } = await authClient.useSession(useFetch);

const schema = z.object({
  originalUrl: z
    .string()
    .transform((val) => val.trim())
    .refine(
      (val) => val === "" || /^[a-zA-Z][a-zA-Z\d+-.]*:/.test(val),
      "Please enter a valid URL",
    ),
});

type Schema = z.output<typeof schema>;

const state = reactive<Schema>({
  originalUrl: "",
});

const loading = ref(false);
const createdLink = ref<{ shortCode: string; originalUrl: string } | null>(null);

async function createShortLink() {
  loading.value = true;
  createdLink.value = null;

  try {
    const result = await authClient.link.create({
      originalUrl: state.originalUrl,
      title: null,
      description: null,
    });

    if (result.error) {
      toast.add({
        title: "Error",
        description: result.error.message || "Failed to create link",
        color: "error",
      });
      return;
    }

    createdLink.value = {
      shortCode: result.data.shortCode,
      originalUrl: state.originalUrl!,
    };

    toast.add({
      title: "Success",
      description: "Link created successfully",
      color: "success",
    });

    state.originalUrl = "";
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

const shortUrl = computed(() => {
  if (!createdLink.value) return "";
  return `${window.location.origin}/s/${createdLink.value.shortCode}`;
});

async function copyToClipboard() {
  if (!shortUrl.value) return;

  try {
    await navigator.clipboard.writeText(shortUrl.value);
    toast.add({
      title: "Copied",
      description: "Link copied to clipboard",
      color: "success",
    });
  } catch (error) {
    toast.add({
      title: "Error",
      description: "Failed to copy link",
      color: "error",
    });
  }
}
</script>

<template>
  <div>
    <UPageHero
      title="Shorten Your Links"
      description="Transform long URLs into short, memorable links with powerful analytics and tracking."
      align="center"
    >
      <template #default>
        <UContainer class="max-w-3xl">
          <div class="flex flex-col items-center gap-8">
            <UForm :schema="schema" :state="state" class="w-full" @submit="createShortLink">
              <UFormField name="originalUrl">
                <UFieldGroup class="w-full">
                  <UInput
                    v-model="state.originalUrl"
                    size="lg"
                    placeholder="Paste your long URL here"
                    :disabled="loading"
                    class="flex-1"
                  />

                  <UButton
                    type="submit"
                    size="lg"
                    :loading="loading"
                    :disabled="!state.originalUrl || state.originalUrl.trim().length === 0"
                  >
                    Shorten
                  </UButton>
                </UFieldGroup>
              </UFormField>
            </UForm>

            <UCard v-if="createdLink" class="w-full">
              <div class="space-y-6">
                <UFormField label="Your short link">
                  <div class="flex items-center gap-2">
                    <UInput
                      :model-value="shortUrl"
                      readonly
                      size="md"
                      color="neutral"
                      variant="outline"
                      class="flex-1"
                    />
                    <UButton icon="i-lucide-copy" size="md" @click="copyToClipboard">
                      Copy
                    </UButton>
                  </div>
                </UFormField>

                <USeparator />

                <UFormField label="Original URL">
                  <UInput
                    :model-value="createdLink.originalUrl"
                    readonly
                    size="md"
                    color="neutral"
                    variant="outline"
                    class="w-full"
                  />
                </UFormField>
              </div>
            </UCard>
          </div>
        </UContainer>
      </template>
    </UPageHero>

    <UPageSection
      id="features"
      title="Features"
      description="Everything you need to manage and track your links"
      :features="[
        {
          icon: 'i-lucide-link',
          title: 'Link Shortening',
          description:
            'Transform long URLs into short, memorable links that are easy to share and remember.',
        },
        {
          icon: 'i-lucide-bar-chart-2',
          title: 'Detailed Analytics',
          description:
            'Track clicks, countries, devices, browsers, and more with interactive charts.',
        },
        {
          icon: 'i-lucide-clock',
          title: 'Time Series Data',
          description:
            'View your link performance over time with hourly, daily, and weekly aggregations.',
        },
        {
          icon: 'i-lucide-globe',
          title: 'Geographic Insights',
          description: 'See where your clicks are coming from with country and city breakdowns.',
        },
        {
          icon: 'i-lucide-tag',
          title: 'UTM Tracking',
          description:
            'Understand your marketing campaigns with source, medium, and term tracking.',
        },
        {
          icon: 'i-lucide-qr-code',
          title: 'QR Code Generation',
          description:
            'Generate QR codes for your short links instantly, perfect for print materials and offline marketing.',
        },
      ]"
    />

    <UPageSection>
      <UPageCTA
        title="Ready to Get Started?"
        description="Create your first short link and start tracking today."
        :links="[
          {
            label: 'Get Started',
            to: session?.user ? '/dashboard' : '/auth/sign-up',
            trailingIcon: 'i-lucide-arrow-right',
            color: 'neutral',
          },
          {
            label: 'View on GitHub',
            to: 'https://github.com/DemoMacro/JS.GS',
            target: '_blank',
            icon: 'i-simple-icons-github',
            color: 'neutral',
            variant: 'outline',
          },
        ]"
      />
    </UPageSection>
  </div>
</template>

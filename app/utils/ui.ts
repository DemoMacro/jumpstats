import type { AuthFormProps } from "@nuxt/ui";

type ExtractAuthFormField<Props> = Props extends AuthFormProps<any, infer F> ? F : never;

export type AuthFormField = ExtractAuthFormField<AuthFormProps>;

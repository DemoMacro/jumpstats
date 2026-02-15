import { z } from "zod";

export const LinkStatusSchema = z.enum(["active", "inactive", "expired"]);

export const LinkSchema = z.object({
  id: z.uuid(),
  domainId: z.uuid().nullable(),
  shortCode: z.string().min(1).max(50),
  originalUrl: z.url(),
  userId: z.uuid().nullable(),
  organizationId: z.uuid().nullable(),
  title: z.string().max(200).nullable(),
  description: z.string().max(500).nullable(),
  status: LinkStatusSchema.default("active"),
  expiresAt: z.coerce.date().nullable(),
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date(),
});

export const CreateLinkSchema = LinkSchema.pick({
  originalUrl: true,
  domainId: true,
  organizationId: true,
  title: true,
  description: true,
  status: true,
  expiresAt: true,
}).partial({
  domainId: true,
  organizationId: true,
  title: true,
  description: true,
  status: true,
  expiresAt: true,
});

export const UpdateLinkSchema = CreateLinkSchema.extend({
  id: z.uuid(),
});

export const LinkQuerySchema = z.object({
  linkId: z.uuid().optional(),
  domainId: z.uuid().optional(),
  organizationId: z.uuid().optional(),
  limit: z.coerce.number().int().min(1).max(100).optional(),
  offset: z.coerce.number().int().min(0).optional(),
  status: LinkStatusSchema.optional(),
});

export type Link = z.infer<typeof LinkSchema>;
export type CreateLink = z.infer<typeof CreateLinkSchema>;
export type UpdateLink = z.infer<typeof UpdateLinkSchema>;
export type LinkStatus = z.infer<typeof LinkStatusSchema>;

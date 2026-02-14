import { z } from "zod";

export const DomainStatusSchema = z.enum(["pending", "active", "inactive"]);

export const DomainSchema = z.object({
  id: z.uuid(),
  domainName: z.string().regex(z.regexes.domain, "Invalid domain name format"),
  userId: z.uuid().nullable(),
  organizationId: z.uuid().nullable(),
  status: DomainStatusSchema.default("pending"),
  verificationToken: z.string().nullable(),
  verifiedAt: z.coerce.date().nullable(),
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date(),
});

export const CreateDomainSchema = DomainSchema.pick({
  domainName: true,
  organizationId: true,
}).partial({
  organizationId: true,
});

export const UpdateDomainSchema = DomainSchema.pick({
  domainName: true,
  status: true,
}).partial();

export const DomainQuerySchema = z.object({
  domainId: z.uuid().optional(),
  organizationId: z.uuid().optional(),
  limit: z.coerce.number().int().min(1).max(100).optional(),
  offset: z.coerce.number().int().min(0).optional(),
  status: DomainStatusSchema.optional(),
});

export const UpdateDomainBodySchema = UpdateDomainSchema.extend({
  domainId: z.uuid().meta({ description: "The ID of domain to update" }),
});

export const VerifyDomainSchema = z.object({
  domainId: z.uuid(),
});

export type Domain = z.infer<typeof DomainSchema>;
export type CreateDomain = z.infer<typeof CreateDomainSchema>;
export type UpdateDomain = z.infer<typeof UpdateDomainSchema>;
export type DomainStatus = z.infer<typeof DomainStatusSchema>;
export type UpdateDomainBody = z.infer<typeof UpdateDomainBodySchema>;
export type VerifyDomain = z.infer<typeof VerifyDomainSchema>;

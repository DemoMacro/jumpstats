import type { DBAdapter, GenericEndpointContext } from "better-auth";
import type { Domain } from "../../../types/domain";
import type { Member } from "better-auth/plugins";
import { APIError } from "better-auth/api";

type Session = {
  user: {
    id: string;
    role?: string;
  };
};

export async function canAccessDomain(
  ctx: GenericEndpointContext,
  domain: Domain,
  session: Session,
): Promise<boolean> {
  // Global admin
  if (session.user.role === "admin") return true;

  // Domain owner
  if (domain.userId === session.user.id) return true;

  // Organization admin/owner
  if (domain.organizationId) {
    const member = await ctx.context.adapter.findOne<Member>({
      model: "member",
      where: [
        { field: "organizationId", value: domain.organizationId },
        { field: "userId", value: session.user.id },
      ],
    });

    return member?.role === "admin" || member?.role === "owner";
  }

  return false;
}

export async function buildDomainWhereConditions(params: {
  userId: string;
  userRole: string;
  organizationId?: string;
  status?: string;
  adapter: DBAdapter;
}): Promise<Array<{ field: string; value: string | number }>> {
  const { userId, userRole, organizationId, status, adapter } = params;

  // Global admin - can see all domains
  if (userRole === "admin") {
    const conditions: Array<{ field: string; value: string | number }> = [];
    if (organizationId) conditions.push({ field: "organizationId", value: organizationId });
    if (status) conditions.push({ field: "status", value: status });
    return conditions;
  }

  // Regular user
  if (organizationId) {
    const member = await adapter.findOne<Member>({
      model: "member",
      where: [
        { field: "organizationId", value: organizationId },
        { field: "userId", value: userId },
      ],
    });

    if (!member) {
      throw new APIError("FORBIDDEN", {
        message: "You are not a member of this organization",
      });
    }

    // Org admin/owner can see all org domains
    if (member.role === "admin" || member.role === "owner") {
      return [
        { field: "organizationId", value: organizationId },
        ...(status ? [{ field: "status", value: status }] : []),
      ];
    }

    // Regular member can only see their own domains in org
    return [
      { field: "organizationId", value: organizationId },
      { field: "userId", value: userId },
      ...(status ? [{ field: "status", value: status }] : []),
    ];
  }

  // Only user's own domains
  return [
    { field: "userId", value: userId },
    ...(status ? [{ field: "status", value: status }] : []),
  ];
}

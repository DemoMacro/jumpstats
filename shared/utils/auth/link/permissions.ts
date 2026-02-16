import type { DBAdapter, GenericEndpointContext } from "better-auth";
import type { Link } from "../../../types/link";
import type { Member } from "better-auth/plugins";
import { APIError } from "better-auth/api";

type Session = {
  user: {
    id: string;
    role?: string;
  };
};

export async function canAccessLink(
  ctx: GenericEndpointContext,
  link: Link,
  session: Session,
): Promise<boolean> {
  // Global admin has full access
  if (session.user.role === "admin") return true;

  // Personal links (organizationId IS NULL) - only creator can operate
  if (!link.organizationId) {
    return link.userId === session.user.id;
  }

  // Organization links - check member role
  const member = await ctx.context.adapter.findOne<Member>({
    model: "member",
    where: [
      { field: "organizationId", value: link.organizationId },
      { field: "userId", value: session.user.id },
    ],
  });

  if (!member) return false;

  // Owner/Admin can operate all organization links
  if (member.role === "owner" || member.role === "admin") {
    return true;
  }

  // Regular members can only operate links they created
  if (member.role === "member") {
    return link.userId === session.user.id;
  }

  return false;
}

export async function buildLinkWhereConditions(params: {
  userId: string;
  userRole: string;
  organizationId?: string;
  status?: string;
  adapter: DBAdapter;
}): Promise<Array<{ field: string; value: string | number | null }>> {
  const { userId, userRole, organizationId, status, adapter } = params;

  // Global admin can see all links
  if (userRole === "admin") {
    const conditions: Array<{ field: string; value: string | number | null }> = [];
    if (organizationId) conditions.push({ field: "organizationId", value: organizationId });
    if (status) conditions.push({ field: "status", value: status });
    return conditions;
  }

  // Organization mode
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

    // Org admin/owner can see all org links
    if (member.role === "admin" || member.role === "owner") {
      return [
        { field: "organizationId", value: organizationId },
        ...(status ? [{ field: "status", value: status }] : []),
      ];
    }

    // Regular member can only see their own links in the org
    return [
      { field: "organizationId", value: organizationId },
      { field: "userId", value: userId },
      ...(status ? [{ field: "status", value: status }] : []),
    ];
  }

  // Personal mode - only show personal links (userId matches AND orgId is null)
  return [
    { field: "userId", value: userId },
    { field: "organizationId", value: null },
    ...(status ? [{ field: "status", value: status }] : []),
  ];
}

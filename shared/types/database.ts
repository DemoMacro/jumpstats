import type { User, Session, Account, Verification } from "better-auth/types";
import type { Organization, Member, Invitation } from "better-auth/plugins";
import type { Generated } from "kysely";
import type { Link } from "./link";

export interface Database {
  user: User;
  session: Session;
  account: Account;
  verification: Verification;
  organization: Organization;
  member: Member;
  invitation: Invitation;
  link: Omit<Link, "id"> & { id: Generated<string> };
}

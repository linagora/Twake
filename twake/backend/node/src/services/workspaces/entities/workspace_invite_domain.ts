import { merge } from "lodash";
import { Column, Entity } from "../../../core/platform/services/database/services/orm/decorators";

export const TYPE = "workspace_invite_domain";

@Entity(TYPE, {
  primaryKey: [["company_id", "workspace_id", "domain"], "id"],
  type: TYPE,
})
export default class WorkspaceInviteDomain {
  @Column("id", "timeuuid")
  id: string;

  @Column("company_id", "timeuuid")
  company_id: string;

  @Column("workspace_id", "timeuuid")
  workspace_id: string;

  @Column("domain", "encoded_string")
  domain: string;
}

export type WorkspaceInviteDomainPrimaryKey = Pick<
  WorkspaceInviteDomain,
  "company_id" | "workspace_id"
>;

export function getInstance(
  workspaceInviteDomain: Partial<WorkspaceInviteDomain> & Partial<WorkspaceInviteDomainPrimaryKey>,
): WorkspaceInviteDomain {
  return merge(new WorkspaceInviteDomain(), workspaceInviteDomain);
}

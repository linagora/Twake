import { merge } from "lodash";
import { Column, Entity } from "../../../core/platform/services/database/services/orm/decorators";

export const TYPE = "workspace_invite_tokens";

@Entity(TYPE, {
  primaryKey: [["company_id"], "workspace_id", "token"],
  type: TYPE,
})
export default class WorkspaceInviteTokens {
  @Column("company_id", "timeuuid")
  company_id: string;

  @Column("workspace_id", "timeuuid")
  workspace_id: string;

  @Column("token", "encoded_string")
  token: string;
}

export type WorkspaceInviteTokensPrimaryKey = Pick<
  WorkspaceInviteTokens,
  "company_id" | "workspace_id" | "token"
>;

export function getInstance(
  workspaceInviteTokens: Partial<WorkspaceInviteTokens> & Partial<WorkspaceInviteTokensPrimaryKey>,
): WorkspaceInviteTokens {
  return merge(new WorkspaceInviteTokens(), workspaceInviteTokens);
}

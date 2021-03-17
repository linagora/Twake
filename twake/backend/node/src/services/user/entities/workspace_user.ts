import { merge } from "lodash";
import { Column, Entity } from "../../../core/platform/services/database/services/orm/decorators";

export const TYPE = "workspace_user";

/**
 * Link between a workspace and a user
 */
@Entity(TYPE, {
  primaryKey: [["workspace_id"], "user_id", "id"],
  type: TYPE,
})
export default class WorkspaceUser {
  @Column("workspace_id", "uuid")
  workspaceId: string;

  @Column("user_id", "uuid")
  userId: string;

  @Column("id", "timeuuid")
  id: string;

  @Column("level_id", "number")
  levelId: number;

  @Column("date_added", "number")
  dateAdded: number;

  @Column("last_access", "number")
  lastAccess: number;

  @Column("hasnotifications", "twake_boolean")
  hasNotifications: boolean;

  @Column("is_externe", "twake_boolean")
  isExternal: boolean;

  @Column("is_auto_add_externe", "twake_boolean")
  autoAddExternalExternal: boolean;
}

export type WorkspaceUserPrimaryKey = Partial<Pick<WorkspaceUser, "workspaceId" | "userId">>;

export function getInstance(
  workspaceUser: Partial<WorkspaceUser> & WorkspaceUserPrimaryKey,
): WorkspaceUser {
  return merge(new WorkspaceUser(), workspaceUser);
}

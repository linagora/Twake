import { merge } from "lodash";
import { Column, Entity } from "../../../core/platform/services/database/services/orm/decorators";

export const TYPE = "workspace";

@Entity(TYPE, {
  primaryKey: [["id"], "group_id"],
  type: TYPE,
})
export default class Workspace {
  @Column("id", "timeuuid")
  id: string;

  @Column("group_id", "timeuuid")
  group_id: string;

  @Column("name", "encoded_string")
  name: string;

  @Column("logo", "uuid")
  logo: string;

  @Column("stats", "uuid")
  stats: string;

  @Column("isdeleted", "twake_boolean")
  isDeleted: boolean;

  @Column("isarchived", "twake_boolean")
  isArchived: boolean;

  @Column("isdefault", "twake_boolean")
  isDefault: boolean;

  @Column("uniquename", "encoded_string")
  uniqueName: string;

  @Column("member_count", "number")
  memberCount: number;

  @Column("guest_count", "number")
  guestCount: number;

  @Column("pending_count", "number")
  pendingCount: number;

  @Column("date_added", "number")
  dateAdded: number;
}

export type WorkspacePrimaryKey = Partial<Pick<Workspace, "id">>;

export function getInstance(workspace: Partial<Workspace> & WorkspacePrimaryKey): Workspace {
  return merge(new Workspace(), workspace);
}

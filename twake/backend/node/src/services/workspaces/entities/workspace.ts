import { merge } from "lodash";
import { Column, Entity } from "../../../core/platform/services/database/services/orm/decorators";

export const TYPE = "workspace";

@Entity(TYPE, {
  primaryKey: [["group_id"], "id"],
  type: TYPE,
})
export default class Workspace {
  @Column("id", "uuid")
  id: string;

  @Column("group_id", "uuid")
  group_id: string;

  @Column("name", "encoded_string")
  name: string;

  @Column("logo", "string")
  logo: string;

  @Column("stats", "encoded_string")
  stats: string;

  @Column("is_deleted", "boolean")
  isDeleted: boolean;

  @Column("is_archived", "boolean")
  isArchived: boolean;

  @Column("is_default", "boolean")
  isDefault: boolean;

  @Column("date_added", "number")
  dateAdded: number;
}

export type WorkspacePrimaryKey = Partial<Pick<Workspace, "group_id" | "id">>;

export function getInstance(workspace: Partial<Workspace> & WorkspacePrimaryKey): Workspace {
  return merge(new Workspace(), workspace);
}

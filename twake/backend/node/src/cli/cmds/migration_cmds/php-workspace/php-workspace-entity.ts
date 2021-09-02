import { Type } from "class-transformer";
import { merge } from "lodash";
import {
  Column,
  Entity,
} from "../../../../core/platform/services/database/services/orm/decorators";

export const TYPE = "workspace";
@Entity(TYPE, {
  primaryKey: [["id"]],
  type: TYPE,
})
export class PhpWorkspace {
  @Column("id", "timeuuid")
  id: string;

  @Column("group_id", "timeuuid")
  group_id: string;

  @Column("name", "encoded_string")
  name: string;

  @Column("logo", "encoded_string")
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

export type PhpMessagePrimaryKey = Pick<PhpWorkspace, "id">;

export function getInstance(workspace: PhpWorkspace): PhpWorkspace {
  return merge(new PhpWorkspace(), workspace);
}

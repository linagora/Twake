import { Type } from "class-transformer";
import {
  Column,
  Entity,
} from "../../../../core/platform/services/database/services/orm/decorators";

export const TYPE = "php_drive_files";

@Entity(TYPE, {
  primaryKey: [["workspace_id"], "parent_id", "id"],
  type: TYPE,
})
export class PhpDriveFile {
  @Type(() => String)
  @Column("workspace_id", "timeuuid")
  workspace_id: string;

  @Type(() => String)
  @Column("parent_id", "string")
  parent_id: string | "";

  @Type(() => String)
  @Column("id", "timeuuid", { generator: "timeuuid" })
  id: string;

  @Column("isintrash", "boolean")
  isintrash: boolean;

  @Column("added", "string")
  added: string;

  @Column("attachements", "encoded_json")
  attachements: unknown;

  @Column("content_keywords", "encoded_json")
  content_keywords: string;

  @Column("creator", "string")
  creator: string;

  @Column("description", "string")
  description: string;

  @Column("extension", "string")
  extension: string;

  @Column("hidden_data", "encoded_json")
  hidden_data: unknown;

  @Column("isdirectory", "boolean")
  isdirectory: boolean;

  @Column("last_modified", "string")
  last_modified: string;

  @Column("name", "string")
  name: string;

  @Column("size", "number")
  size: number;

  @Column("tags", "encoded_json")
  tags: string[];
}

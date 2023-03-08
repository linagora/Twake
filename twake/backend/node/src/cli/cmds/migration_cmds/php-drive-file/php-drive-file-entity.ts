import { Type } from "class-transformer";
import {
  Column,
  Entity,
} from "../../../../core/platform/services/database/services/orm/decorators";

export const TYPE = "drive_file";

@Entity(TYPE, {
  primaryKey: [["workspace_id"], "parent_id", "id"],
  type: TYPE,
})
export class PhpDriveFile {
  @Type(() => String)
  @Column("id", "timeuuid", { generator: "timeuuid" })
  id: string;

  @Type(() => String)
  @Column("workspace_id", "string")
  workspace_id: string;

  @Type(() => String)
  @Column("parent_id", "string")
  parent_id: string;

  @Type(() => Boolean)
  @Column("isintrash", "boolean")
  isintrash: boolean;

  @Type(() => String)
  @Column("root_group_folder", "timeuuid")
  root_group_folder: string;

  @Type(() => String)
  @Column("public_access_key", "string")
  public_access_key: string;

  @Type(() => String)
  @Column("name", "string")
  name: string;

  @Type(() => String)
  @Column("extension", "string")
  extension: string;

  @Type(() => String)
  @Column("description", "string")
  description: string;

  @Type(() => Boolean)
  @Column("isdirectory", "boolean")
  isdirectory: boolean;

  @Type(() => String)
  @Column("old_parent", "string")
  old_parent: string;

  @Type(() => Number)
  @Column("added", "twake_datetime")
  added: number;

  @Type(() => String)
  @Column("creator", "twake_datetime")
  creator: string;

  @Type(() => Number)
  @Column("size", "number")
  size: number;

  @Type(() => String)
  @Column("content_keywords", "string")
  content_keywords: string;

  @Type(() => String)
  @Column("acces_info", "string")
  acces_info: string;

  @Type(() => String)
  @Column("tags", "encoded_json")
  tags: string[];

  @Column("hidden_data", "encoded_json")
  hidden_data: Record<string, unknown>;
}

export type PhpDriveFilePrimaryKey = Pick<PhpDriveFile, "parent_id" | "workspace_id" | "id">;

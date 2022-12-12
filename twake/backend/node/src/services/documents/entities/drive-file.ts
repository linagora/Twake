import { Type } from "class-transformer";
import { Column, Entity } from "../../../core/platform/services/database/services/orm/decorators";
import { FileVersion } from "./file-version";

export const TYPE = "drive_files";

@Entity(TYPE, {
  primaryKey: [["company_id", "id"], "parent_id"],
  type: TYPE,
})
export class DriveFile {
  @Type(() => String)
  @Column("company_id", "uuid")
  company_id: string;

  @Type(() => String)
  @Column("id", "uuid", { generator: "uuid" })
  id: string;

  @Type(() => String)
  @Column("parent_id", "uuid")
  parent_id: string;

  @Type(() => Boolean)
  @Column("is_instrash", "boolean")
  is_instrash: boolean;

  @Type(() => Boolean)
  @Column("is_directory", "boolean")
  is_directory: boolean;

  @Type(() => String)
  @Column("name", "string")
  name: string;

  @Type(() => String)
  @Column("extension", "string")
  extension: string;

  @Type(() => String)
  @Column("description", "string")
  description: string;

  @Column("tags", "encoded_json")
  tags: string[];

  @Type(() => String)
  @Column("added", "string")
  added: string;

  @Type(() => String)
  @Column("last_modified", "string")
  last_modified: string;

  @Column("access_info", "encoded_json")
  access_info: AccessInformation;

  @Type(() => String)
  @Column("content_keywords", "string")
  content_keywords: string;

  @Column("hidden_data", "encoded_json")
  hidden_data: unknown;

  @Type(() => String)
  @Column("workspace_id", "uuid")
  workspace_id: string;

  @Type(() => String)
  @Column("workspace_id", "string")
  public_access_key: string;

  @Type(() => String)
  @Column("root_group_folder", "string")
  root_group_folder: string;

  @Type(() => String)
  @Column("creator", "uuid")
  creator: string;

  @Type(() => Number)
  @Column("size", "number")
  size: number;

  @Type(() => Boolean)
  @Column("detached_file", "boolean")
  detached_file: boolean;

  @Type(() => Boolean)
  @Column("has_preview", "boolean")
  has_preview: boolean;

  @Type(() => Boolean)
  @Column("shared", "boolean")
  shared: boolean;

  @Type(() => String)
  @Column("url", "string")
  url: string;

  @Type(() => String)
  @Column("preview_link", "string")
  preview_link: string;

  @Type(() => String)
  @Column("object_link_cache", "string")
  object_link_cache: string;

  @Type(() => Boolean)
  @Column("external_storage", "boolean")
  external_storage: boolean;

  @Type(() => String)
  @Column("last_user", "uuid")
  last_user: string;

  @Column("attachements", "encoded_json")
  attachements: unknown[];

  @Column("last_version_cache", "encoded_json")
  last_version_cache: Partial<FileVersion>;
}

type AccessInformation = {
  public_access_token: string;
  authorized_entities: AuthEntity[];
  unauthorized_entities: AuthEntity[];
};

type AuthEntity = {
  type: string;
  id: string;
};

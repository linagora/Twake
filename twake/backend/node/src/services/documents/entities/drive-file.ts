import { Type } from "class-transformer";
import { Column, Entity } from "src/core/platform/services/database/services/orm/decorators";

const TYPE = "drive_files";

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
}

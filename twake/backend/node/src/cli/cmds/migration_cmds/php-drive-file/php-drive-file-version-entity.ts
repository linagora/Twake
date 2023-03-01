import { Type } from "class-transformer";
import {
  Column,
  Entity,
} from "../../../../core/platform/services/database/services/orm/decorators";

export const TYPE = "drive_file_version";

@Entity(TYPE, {
  primaryKey: [["file_id"], "id"],
  type: TYPE,
})
export class PhpDriveFileVersion {
  @Type(() => String)
  @Column("id", "timeuuid", { generator: "timeuuid" })
  id: string;

  @Type(() => String)
  @Column("file_id", "string")
  file_id: string;

  @Type(() => String)
  @Column("creator_id", "string")
  creator_id: string;

  @Type(() => String)
  @Column("realname", "string")
  realname: string;

  @Type(() => String)
  @Column("key", "string")
  key: string;

  @Type(() => String)
  @Column("mode", "string")
  mode: string;

  @Type(() => String)
  @Column("file_size", "number")
  file_size: number;

  @Type(() => String)
  @Column("date_added", "string")
  date_added: string;

  @Type(() => String)
  @Column("filename", "string")
  filename: string;

  @Type(() => String)
  @Column("provider", "string")
  provider: string;

  @Column("data", "encoded_json")
  data: unknown;
}

export type PhpDriveFileVersionPrimaryKey = Pick<PhpDriveFileVersion, "file_id" | "id">;

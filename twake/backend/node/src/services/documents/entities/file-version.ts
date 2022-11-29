import { Type } from "class-transformer";
import { Column, Entity } from "src/core/platform/services/database/services/orm/decorators";

export const TYPE = "file_version";

@Entity(TYPE, {
  primaryKey: [["id"]],
  type: TYPE,
})
export class FileVersion {
  @Type(() => String)
  @Column("id", "uuid")
  id: string;

  @Type(() => String)
  @Column("provider", "string")
  provider: "internal" | "drive" | string;

  @Type(() => String)
  @Column("file_id", "uuid")
  file_id: string;

  @Column("file_metadata", "encoded_json")
  file_metadata: DriveFileMetadata;

  @Type(() => Number)
  @Column("date_added", "number")
  date_added: number;

  @Type(() => String)
  @Column("creator_id", "uuid")
  creator_id: string;

  @Type(() => String)
  @Column("application_id", "uuid")
  application_id: string;

  @Type(() => String)
  @Column("realname", "string")
  realname: string;

  @Type(() => String)
  @Column("key", "string")
  key: string;

  @Type(() => String)
  @Column("mode", "string")
  mode: string | "OpenSSL-2";

  @Type(() => Number)
  @Column("file_size", "number")
  file_size: number;

  @Type(() => String)
  @Column("filename", "string")
  filename: string;

  @Column("data", "encoded_json")
  data: unknown;
}

type DriveFileMetadata = {
  source: "internal" | "drive" | string;
  external_id: string;

  name?: string;
  mime?: string;
  size?: number;
  thumbnails?: DriveFileThumbnail;
};

type DriveFileThumbnail = {
  index: number;
  id: string;

  type: string;
  size: number;
  width: number;
  height: number;

  url: string;
  full_url?: string;
};

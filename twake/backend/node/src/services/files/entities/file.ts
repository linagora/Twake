import { Type } from "class-transformer";
import { Entity, Column } from "../../../core/platform/services/database/services/orm/decorators";

@Entity("files", {
  primaryKey: [["company_id"], "id"],
  type: "files",
})
export class File {
  @Type(() => String)
  @Column("company_id", "uuid")
  company_id: string;

  @Type(() => String)
  @Column("id", "uuid", { generator: "uuid" })
  id: string;

  @Column("owner_type", "encoded_string")
  owner_type: "user" | "application";

  @Column("owner_id", "uuid")
  owner_id: string;

  @Column("cipher", "encoded_string")
  cipher: string;

  @Column("metadata", "encoded_json")
  metadata: {
    name: string;
    extension: string;
    thumbmail: "";
    width?: number;
    height?: number;
    type:
      | "link"
      | "code"
      | "document"
      | "image"
      | "pdf"
      | "slides"
      | "sound"
      | "spreadsheet"
      | "video"
      | "archive"
      | "other";
  };

  @Column("upload_data", "encoded_json")
  upload_data: {
    size: number;
    chunks: number;
  };
}

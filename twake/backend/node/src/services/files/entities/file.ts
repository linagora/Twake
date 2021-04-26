import { Type } from "class-transformer";
import { Entity, Column } from "../../../core/platform/services/database/services/orm/decorators";

@Entity("files", {
  primaryKey: [["company_id"], "id"],
  type: "files",
})
export class File {
  @Type(() => String)
  @Column("company_id", "uuid", { generator: "uuid" })
  company_id: string;

  @Type(() => String)
  @Column("id", "uuid", { generator: "uuid" })
  id: string;

  @Column("metadata", "encoded_json")
  metadata: {
    owner: string; //User creating the resource
    name: string;
    size: number;
    width?: number;
    height?: number;
    extension: "string";
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
}

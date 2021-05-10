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

  @Type(() => String)
  @Column("user_id", "encoded_string")
  user_id: string;

  @Column("application_id", "encoded_string")
  application_id: null | string;

  @Column("encryption_key", "encoded_string")
  encryption_key: string;

  @Column("metadata", "encoded_json")
  metadata: null | {
    name: string;
    mime: string;
  };

  @Column("thumbmail", "encoded_json")
  thumbmail: null | {
    thumbmail: string;
    width: number;
    height: number;
  };

  @Column("upload_data", "encoded_json")
  upload_data: null | {
    size: number;
    chunks: number;
  };
}

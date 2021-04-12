import { Type } from "class-transformer";
import { Entity, Column } from "../../../core/platform/services/database/services/orm/decorators";

@Entity("files", {
  primaryKey: [["name"], "id"],
  type: "channels",
})
export class File {
  // uuid-v4

  @Type(() => String)
  @Column("id", "uuid", { generator: "uuid" })
  id: string;

  @Column("name", "encoded_string")
  name: string;

  @Column("size", "encoded_string")
  size: number;

  @Column("width", "encoded_string")
  width: number;

  @Column("height", "encoded_string")
  height: number;

  @Column("type", "encoded_string")
  type: string;
}

import {
  Column,
  Entity,
} from "../../../../core/platform/services/database/services/orm/decorators";

export const TYPE = "device";
@Entity(TYPE, {
  primaryKey: [["id"]],
  type: TYPE,
})
export class PhpDevice {
  @Column("id", "timeuuid")
  id: string;

  @Column("user_id", "timeuuid")
  user_id: string;

  @Column("type", "string")
  type: string;

  @Column("version", "string")
  version: string;

  @Column("value", "encoded_string")
  value: string;
}

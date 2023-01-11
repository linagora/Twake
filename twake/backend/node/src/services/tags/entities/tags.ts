import { Type } from "class-transformer";
import { Column, Entity } from "../../../core/platform/services/database/services/orm/decorators";

export const TYPE = "tags";
/**
 * Table user-notification-badges
 */
@Entity(TYPE, {
  primaryKey: [["company_id"], "name", "colour"],
  type: TYPE,
})
export class Tags {
  /**
   * UUIDv4
   * Primary key / partition key
   */
  @Type(() => String)
  @Column("tag_id", "uuid")
  tag_id: string;

  /**
   * name
   */
  @Type(() => String)
  @Column("name", "string")
  name: string;

  /**
   * colour
   */
  @Type(() => String)
  @Column("colour", "string")
  colour: string;
}

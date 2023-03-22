import { Type } from "class-transformer";
import {
  Column,
  Entity,
} from "../../../../core/platform/services/database/services/orm/decorators";

export const TYPE = "php_drive_migration_record";

@Entity(TYPE, {
  primaryKey: [["company_id"], "item_id"],
  type: TYPE,
})
export class phpDriveMigrationRecord {
  @Type(() => String)
  @Column("item_id", "timeuuid")
  item_id: string;

  @Type(() => String)
  @Column("company_id", "uuid")
  company_id: string;

  @Type(() => String)
  @Column("new_id", "string")
  new_id: string;
}

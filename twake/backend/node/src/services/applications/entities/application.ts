import { Entity } from "../../../core/platform/services/database/services/orm/decorators";

const TYPE = "application";

@Entity(TYPE, {
  primaryKey: [["group_id"], "app_group_name", "id"],
  type: TYPE,
})
export class Application {}

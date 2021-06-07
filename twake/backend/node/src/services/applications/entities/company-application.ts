import { Entity } from "../../../core/platform/services/database/services/orm/decorators";

const TYPE = "group_app";

@Entity(TYPE, {
  primaryKey: [["group_id"], "app_id", "id"],
  type: TYPE,
})
export class CompanyApplication {}

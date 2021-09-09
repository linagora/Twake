import { Type } from "class-transformer";
import {
  Column,
  Entity,
} from "../../../../core/platform/services/database/services/orm/decorators";

export const TYPE = "application";

@Entity(TYPE, {
  primaryKey: [["group_id"], "app_group_name", "id"],
  type: TYPE,
})
export default class PhpApplication {
  @Type(() => String)
  @Column("id", "timeuuid", { generator: "timeuuid" })
  id: string;

  @Type(() => String)
  @Column("group_id", "timeuuid")
  group_id: string;

  @Type(() => String)
  @Column("app_group_name", "string")
  app_group_name: string = "";

  @Column("name", "encoded_string")
  depreciated_name: string;

  @Column("description", "encoded_string")
  depreciated_description: string;

  @Column("icon_url", "encoded_string")
  depreciated_icon_url: string;

  @Column("public", "twake_boolean")
  depreciated_public: boolean;

  @Column("twake_team_validation", "twake_boolean")
  depreciated_twake_team_validation: boolean;

  @Column("is_available_to_public", "twake_boolean")
  depreciated_is_available_to_public: boolean; //Vrai si $public ET $twake_team_validation

  @Column("api_events_url", "encoded_string")
  depreciated_api_events_url: string;

  @Column("api_allowed_ip", "encoded_string")
  depreciated_api_allowed_ip: string;

  @Column("api_private_key", "encoded_string")
  depreciated_api_private_key: string;

  @Column("privileges", "encoded_string")
  depreciated_privileges = "[]";

  @Column("capabilities", "encoded_string")
  depreciated_capabilities = "[]";

  @Column("hooks", "encoded_string")
  depreciated_hooks = "[]";

  @Column("display_configuration", "encoded_string")
  depreciated_display_configuration = "{}";
}

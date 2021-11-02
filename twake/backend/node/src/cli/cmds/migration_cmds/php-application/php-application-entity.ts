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

  @Column("simple_name", "encoded_string")
  depreciated_simple_name: string;

  @Column("description", "encoded_string")
  depreciated_description: string;

  @Column("icon_url", "encoded_string")
  depreciated_icon_url: string;

  @Column("is_default", "twake_boolean")
  is_default: boolean;

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

export type DepreciatedDisplayConfiguration = {
  version?: 0; //Legacy
  tasks_module?: {
    can_connect_to_tasks?: boolean;
  };
  calendar_module?: {
    can_connect_to_calendar?: boolean;
  };
  drive_module?: {
    can_connect_to_directory?: boolean;
    can_open_files?: {
      url?: string; //Une url à appeler pour éditer le fichier (ouvert dans un onglet)
      preview_url?: string; //Une url à appeler pour prévisualiser un fichier (iframe)
      main_ext?: string[]; //Extensions principales
      other_ext?: string[]; //Extensions secondaires
    };
    can_create_files?: {
      url?: string;
      filename?: string;
      name?: string;
    }[];
  };
  member_app?: boolean; // Si défini, votre application génèrera un membre
  // virtuel dans l'espace de travail avec lequel les
  // utilisateurs pourront discuter.
  messages_module?: {
    in_plus?: {
      should_wait_for_popup: boolean;
    };
    right_icon?: {
      icon_url?: string; //If defined replace original icon url of your app
      should_wait_for_popup?: boolean;
      type?: string; //"file" | "call"
    };
    action?: {
      should_wait_for_popup?: boolean;
      description?: string; //Description de l'action, sinon remplacé par le nom de l'app
    };
    commands?: {
      command?: string; // my_app mycommand
      description?: string;
    }[];
  };
  channel?: {
    can_connect_to_channel?: string;
  };
  channel_tab?: {
    iframe?: string;
  };
  app?: {
    iframe?: string;
    plus_btn: {
      should_wait_for_popup?: boolean;
    };
  };
  configuration?: {
    can_configure_in_workspace?: boolean;
    can_configure_in_channel?: boolean;
    can_configure_in_calendar?: boolean;
    can_configure_in_tasks?: boolean;
  };
};

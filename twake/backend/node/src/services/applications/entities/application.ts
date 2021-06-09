import { Type } from "class-transformer/decorators";
import { Column, Entity } from "../../../core/platform/services/database/services/orm/decorators";

const TYPE = "application";

@Entity(TYPE, {
  primaryKey: [["group_id"], "app_group_name", "id"],
  type: TYPE,
})
export class Application {
  @Type(() => String)
  @Column("group_id", "timeuuid")
  company_id: string;

  @Type(() => String)
  @Column("app_group_name", "string")
  app_group_name: string = "";

  @Type(() => String)
  @Column("id", "timeuuid", { generator: "timeuuid" })
  id: string;

  @Column("identity", "json")
  identity: ApplicationIdentity;

  @Column("api", "encoded_json")
  api: ApplicationApi;

  @Column("access", "json")
  access: ApplicationAccess;

  @Column("display", "json")
  display: ApplicationDisplay;

  @Column("publication", "json")
  publication: ApplicationPublication;

  @Column("stats", "json")
  stats: ApplicationStatistics;

  //Depreciated fields

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

export const importDepreciatedFields = (application: Application) => {
  if (!application.identity?.name) {
    application.identity = {
      name: application.depreciated_name,
      icon: application.depreciated_icon_url,
      description: application.depreciated_description,
      website: "http://twake.app/",
      categories: [],
      compatibility: ["twake"],
    };
  }

  if (application.publication?.published === undefined) {
    application.publication.published = application.depreciated_is_available_to_public;
    application.publication.pending =
      application.depreciated_public && !application.depreciated_twake_team_validation;
  }

  if (!application.stats?.version) {
    application.stats.version = 1;
    application.stats.createdAt = Date.now();
    application.stats.updatedAt = Date.now();
  }

  if (!application.api?.privateKey) {
    application.api.hooksUrl = application.depreciated_api_events_url;
    application.api.allowedIps = application.depreciated_api_allowed_ip;
    application.api.privateKey = application.depreciated_api_private_key;
  }

  if (application.access?.capabilities === undefined) {
    try {
      application.access.capabilities =
        JSON.parse(application.depreciated_capabilities || "[]") || [];
    } catch (e) {
      application.access.capabilities = [];
    }
    try {
      application.access.privileges = JSON.parse(application.depreciated_privileges || "[]") || [];
    } catch (e) {
      application.access.privileges = [];
    }
    try {
      application.access.hooks = JSON.parse(application.depreciated_hooks || "[]") || [];
    } catch (e) {
      application.access.hooks = [];
    }
  }

  if (!application.display?.twake) {
    application.display = application.display || { twake: {} };
    application.display.twake = JSON.parse(application.depreciated_display_configuration) || {};
  }

  return application;
};

type ApplicationIdentity = {
  name: string;
  icon: string;
  description: string;
  website: string;
  categories: string[];
  compatibility: "twake"[];
};

type ApplicationPublication = {
  published: boolean; //Publication accepted
  pending: boolean; //Publication requested
};

type ApplicationStatistics = {
  createdAt: number;
  updatedAt: number;
  version: number;
};

type ApplicationApi = {
  hooksUrl: string;
  allowedIps: string;
  privateKey: string;
};

type ApplicationAccess = {
  privileges: string[];
  capabilities: string[];
  hooks: string[];
};

type ApplicationDisplay = {
  twake: {};
};

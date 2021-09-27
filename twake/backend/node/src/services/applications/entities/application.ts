import { Type } from "class-transformer";
import { merge } from "lodash";
import { Column, Entity } from "../../../core/platform/services/database/services/orm/decorators";
import search from "./application.search";

export const TYPE = "applications";

@Entity(TYPE, {
  primaryKey: ["id"],
  type: TYPE,
  search,
})
export default class Application {
  @Type(() => String)
  @Column("id", "timeuuid", { generator: "timeuuid" })
  id: string;

  @Type(() => String)
  @Column("group_id", "timeuuid")
  company_id: string;

  @Column("is_default", "boolean")
  is_default: boolean;

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
}

export type ApplicationPrimaryKey = { id: string };

export function getInstance(message: Application): Application {
  return merge(new Application(), message);
}

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
  twake: {
    version: 1;

    files?: {
      preview?: {
        url: string; //Url to preview file (full screen or inline)
        inline?: boolean;
        main_ext?: string[]; //Main extensions app can read
        other_ext?: string[]; //Secondary extensions app can read
      };
      actions?: //List of action that can apply on a file
      {
        name: string;
        id: string;
      }[];
    };

    //Chat plugin
    chat?: {
      input?:
        | true
        | {
            icon?: string; //If defined replace original icon url of your app
            type?: "file" | "call"; //To add in existing apps folder / default icon
          };
      commands?: {
        command: string; // my_app mycommand
        description: string;
      }[];
      actions?: //List of action that can apply on a message
      {
        name: string;
        id: string;
      }[];
    };

    //Allow app to appear as a bot user in direct chat
    direct?:
      | true
      | {
          name?: string;
          icon?: string; //If defined replace original icon url of your app
        };

    //Display app as a standalone application in a tab
    tab?: {
      url: string;
    };

    //Display app as a standalone application on the left bar
    standalone?: {
      url: string;
    };

    //Define where the app can be configured from
    configuration?: ("global" | "channel")[];
  };
};

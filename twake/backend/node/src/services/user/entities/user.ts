import { merge } from "lodash";
import { Column, Entity } from "../../../core/platform/services/database/services/orm/decorators";
import search from "./user.search";
import { uuid } from "../../../utils/types";

export const TYPE = "user";

@Entity(TYPE, {
  primaryKey: [["id"]],
  globalIndexes: [["email_canonical"]],
  type: TYPE,
  search,
})
export default class User {
  @Column("id", "timeuuid")
  id: uuid;

  @Column("first_name", "encoded_string")
  first_name: string;

  @Column("last_name", "encoded_string")
  last_name: string;

  @Column("picture", "encoded_string")
  picture: string;

  @Column("status_icon", "string")
  private _status_icon: string; // = '["", ""]';

  public get status_icon(): string {
    if (this._status_icon && this._status_icon.startsWith("[\\")) {
      try {
        const parsed = JSON.parse(this._status_icon.replace(/\\"/g, '"').replace(/\\\\/g, "\\"));
        return `${parsed[0]} ${parsed[1]}`;
      } catch (e) {
        return "";
      }
    }
    return this._status_icon;
  }

  public set status_icon(status: string) {
    this._status_icon = status;
  }

  @Column("last_activity", "number")
  last_activity: number;

  @Column("creation_date", "number")
  creation_date: number;

  @Column("notification_preference", "encoded_json")
  // FIXME= Which type to use with encoded json? This is an object at the end
  notification_preference: any;

  @Column("identity_provider", "encoded_string")
  identity_provider: string;

  @Column("identity_provider_id", "encoded_string")
  identity_provider_id: string;

  @Column("token_login", "encoded_string")
  token_login: string;

  // TODO: Index
  @Column("username_canonical", "string")
  username_canonical: string;

  // TODO: Index
  @Column("email_canonical", "string")
  email_canonical: string;

  @Column("password", "string")
  password: string;

  @Column("deleted", "twake_boolean")
  deleted: boolean;

  @Column("mail_verified", "twake_boolean")
  mail_verified: boolean;

  @Column("phone", "string")
  phone: string;

  @Column("thumbnail_id", "timeuuid")
  thumbnail_id: string;

  @Column("language", "string")
  language: string;

  @Column("timezone", "number")
  timezone: number;

  @Column("preferences", "encoded_json")
  preferences: null | {
    timezone?: number;
    language?: string;
    allow_tracking?: boolean;
  };

  @Column("cache", "encoded_json")
  cache: null | {
    companies: string[];
    workspaces: string[];
  };

  @Column("devices", "encoded_json")
  devices: Array<string>;

  @Column("salt", "string")
  salt: string;

  constructor(id?: string) {
    this.id = id;
  }
}

export type UserPrimaryKey = Pick<User, "id">;

export function getInstance(user: Partial<User> & UserPrimaryKey): User {
  return merge(new User(), user);
}

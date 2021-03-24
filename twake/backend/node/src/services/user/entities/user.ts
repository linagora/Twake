import { merge } from "lodash";
import { Column, Entity } from "../../../core/platform/services/database/services/orm/decorators";

export const TYPE = "user";

@Entity(TYPE, {
  primaryKey: [["id"]],
  type: TYPE,
})
export default class User {
  @Column("id", "timeuuid")
  id: string;

  @Column("banned", "twake_boolean")
  banned = false;

  @Column("is_robot", "twake_boolean")
  isrobot = false;

  @Column("first_name", "encoded_string")
  firstname: string;

  @Column("last_name", "encoded_string")
  lastname: string;

  /**
   * FIXME: This is a thumbnail_id in current user table
   */
  @Column("thumbnail", "string")
  thumbnail: string;

  @Column("workspaces", "encoded_json")
  workspaces: Array<string>;

  /**
   * @ORM\Column(name="groups", type="twake_text")
   * FIXME: Decode error, check the type, if JSON
   */
  @Column("groups", "encoded_json")
  groups: Array<string>;

  @Column("connections", "number")
  connections: number;

  @Column("connected", "twake_boolean")
  connected: boolean;

  // FIXME: Looks like this is an array stringified, need to check DB
  @Column("status_icon", "json")
  status_icon: string; // = '["", ""]';

  @Column("last_activity", "number")
  lastactivity: number;

  @Column("creation_date", "number")
  creationdate: number;

  @Column("language", "string")
  language = "en";

  @Column("notification_preference", "encoded_json")
  // FIXME= Which type to use with encoded json? This is an object at the end
  notification_preference: any;

  @Column("notification_read_increment", "number")
  notification_read_increment = 0;

  @Column("notification_write_increment", "number")
  notification_write_increment = 0;

  @Column("workspaces_preference", "encoded_json")
  workspaces_preference: any;

  @Column("tutorial_status", "encoded_json")
  tutorial_status: any;

  @Column("phone", "encoded_string")
  phone: string;

  @Column("identity_provider", "encoded_string")
  identity_provider: string;

  @Column("identity_provider_id", "encoded_string")
  identity_provider_id: string;

  @Column("token_login", "encoded_string")
  token_login: string;

  @Column("origin", "string")
  origin: string;

  @Column("is_new", "twake_boolean")
  isnew = true;

  @Column("mail_verified", "twake_boolean")
  mail_verified = false;

  @Column("mail_verification_override", "string")
  mail_verification_override: string;

  // TODO: Index
  @Column("username_canonical", "string")
  usernamecanonical: string;

  // TODO: Index
  @Column("email_canonical", "string")
  emailcanonical: string;

  @Column("remember_me_secret", "encoded_string")
  remember_me_secret: string;

  @Column("enabled", "twake_boolean")
  enabled: boolean;

  @Column("salt", "string")
  salt: string;

  @Column("password", "string")
  password: string;

  @Column("timezone", "string")
  timezone: string;

  // FIXME: This is a datetime
  @Column("last_login", "number")
  lastlogin: number;

  @Column("confirmation_token", "string")
  confirmationtoken: string;

  // FIXME: This is a datetime
  @Column("password_requested_at", "number")
  passwordrequestedat: number;

  // FIXME:  This is an array in PHP and looks like a:0:{} in the DB
  @Column("roles", "json")
  roles: Array<string>;

  constructor(id?: string) {
    this.id = id;
  }
}

export type UserPrimaryKey = Pick<User, "id">;

export function getInstance(user: Partial<User> & UserPrimaryKey): User {
  return merge(new User(), user);
}

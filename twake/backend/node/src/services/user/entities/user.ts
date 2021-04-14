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

  @Column("first_name", "encoded_string")
  firstname: string;

  @Column("last_name", "encoded_string")
  lastname: string;

  @Column("picture", "string")
  picture: string;

  // FIXME: Looks like this is an array stringified, need to check DB
  @Column("status_icon", "json")
  status_icon: string; // = '["", ""]';

  @Column("last_activity", "number")
  last_activity: number;

  @Column("creation_date", "number")
  creation_date: number;

  @Column("language", "string")
  language: string;

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
  usernamecanonical: string;

  // TODO: Index
  @Column("email_canonical", "string")
  emailcanonical: string;

  @Column("timezone", "string")
  timezone: string;

  constructor(id?: string) {
    this.id = id;
  }
}

export type UserPrimaryKey = Pick<User, "id">;

export function getInstance(user: Partial<User> & UserPrimaryKey): User {
  return merge(new User(), user);
}

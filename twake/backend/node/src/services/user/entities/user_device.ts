import { merge } from "lodash";
import { Column, Entity } from "../../../core/platform/services/database/services/orm/decorators";

export const TYPE = "device";

@Entity(TYPE, {
  primaryKey: [["user_id"], "id"],
  type: TYPE,
})
export default class UserDevice {
  @Column("id", "timeuuid")
  id: string;

  @Column("user_id", "timeuuid")
  user_id: string;

  @Column("type", "string")
  type: string;

  @Column("version", "string")
  version: string;

  @Column("value", "encoded_string")
  value: string;
}

export type UserDevicePrimaryKey = Pick<UserDevice, "id">;

export function getInstance(userDevice: Partial<UserDevice> & UserDevicePrimaryKey): UserDevice {
  return merge(new UserDevice(), userDevice);
}

import { merge } from "lodash";
import { Column, Entity } from "../../../core/platform/services/database/services/orm/decorators";
import { uuid } from "../../../utils/types";

export const TYPE = "device";

@Entity(TYPE, {
  primaryKey: [["token"]],
  type: TYPE,
})
export default class Device {
  @Column("token", "string")
  token: string;

  @Column("user_id", "uuid")
  user_id: uuid;

  @Column("type", "string")
  type: string;

  @Column("version", "string")
  version: string;
}

export type UserDevicePrimaryKey = Pick<Device, "token">;

export function getInstance(userDevice: Partial<Device> & UserDevicePrimaryKey): Device {
  return merge(new Device(), userDevice);
}

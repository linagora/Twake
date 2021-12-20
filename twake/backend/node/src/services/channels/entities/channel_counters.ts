import { Column, Entity } from "../../../core/platform/services/database/services/orm/decorators";

export const TYPE = "channel_counters";

@Entity(TYPE, {
  primaryKey: [["id"], "counter_type", "company_id", "workspace_id"],
  type: TYPE,
})
export class ChannelCounterEntity {
  @Column("id", "timeuuid")
  id: string;

  @Column("counter_type", "string")
  counter_type: string;

  @Column("company_id", "timeuuid")
  company_id: string;

  @Column("workspace_id", "string")
  workspace_id: string;

  @Column("value", "counter")
  value: number;
}

export type ChannelCounterPrimaryKey = Pick<
  ChannelCounterEntity,
  "id" | "counter_type" | "company_id" | "workspace_id"
>;

export enum ChannelUserCounterType {
  MEMBERS = "members",
  GUESTS = "guests",
}

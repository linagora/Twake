import { Column, Entity } from "../../../core/platform/services/database/services/orm/decorators";
import { CounterEntity } from "../../../utils/counters";

export const TYPE = "channel_counters";

@Entity(TYPE, {
  primaryKey: [["id"], "counter_type", "company_id", "workspace_id"],
  type: TYPE,
})
export class ChannelCounterEntity extends CounterEntity {
  @Column("id", "timeuuid")
  id: string;

  @Column("counter_type", "string")
  counter_type: string;

  @Column("company_id", "timeuuid")
  company_id: string;

  @Column("workspace_id", "timeuuid")
  workspace_id: string;
}

export type ChannelCounterPrimaryKey = Pick<
  ChannelCounterEntity,
  "id" | "counter_type" | "company_id" | "workspace_id"
>;

export enum ChannelUserCounterType {
  MEMBERS = "members",
  GUESTS = "guests",
}

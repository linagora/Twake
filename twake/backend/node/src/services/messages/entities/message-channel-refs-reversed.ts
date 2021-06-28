import { Type } from "class-transformer";
import { merge } from "lodash";
import { Column, Entity } from "../../../core/platform/services/database/services/orm/decorators";

export const TYPE = "message_channel_refs_reversed";
@Entity(TYPE, {
  primaryKey: [["company_id", "workspace_id"], "channel_id", "thread_id"],
  type: TYPE,
})
export class MessageChannelRefReversed {
  @Type(() => String)
  @Column("company_id", "uuid")
  company_id: string;

  @Type(() => String)
  @Column("workspace_id", "string")
  workspace_id: string;

  @Type(() => String)
  @Column("channel_id", "string")
  channel_id: string;

  @Type(() => String)
  @Column("thread_id", "timeuuid", { order: "DESC" })
  thread_id: string;

  @Type(() => String)
  @Column("message_id", "timeuuid")
  message_id: string;
}

export type MessageChannelRefReversedPrimaryKey = Pick<
  MessageChannelRefReversed,
  "company_id" | "workspace_id" | "channel_id" | "thread_id"
>;

export function getInstance(ref: MessageChannelRefReversed): MessageChannelRefReversed {
  return merge(new MessageChannelRefReversed(), ref);
}

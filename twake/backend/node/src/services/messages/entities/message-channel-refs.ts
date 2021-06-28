import { Type } from "class-transformer";
import { merge } from "lodash";
import { Column, Entity } from "../../../core/platform/services/database/services/orm/decorators";

export const TYPE = "message_channel_refs";
@Entity(TYPE, {
  primaryKey: [["company_id", "workspace_id"], "channel_id", "message_id"],
  type: TYPE,
})
export class MessageChannelRef {
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
  @Column("message_id", "timeuuid", { order: "DESC" })
  message_id: string;

  @Type(() => String)
  @Column("thread_id", "timeuuid")
  thread_id: string;
}

export type MessageChannelRefPrimaryKey = Pick<
  MessageChannelRef,
  "company_id" | "workspace_id" | "channel_id" | "message_id"
>;

export function getInstance(ref: MessageChannelRef): MessageChannelRef {
  return merge(new MessageChannelRef(), ref);
}

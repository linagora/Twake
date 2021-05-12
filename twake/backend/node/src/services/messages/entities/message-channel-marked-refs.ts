import { Type } from "class-transformer";
import { merge } from "lodash";
import { Column, Entity } from "../../../core/platform/services/database/services/orm/decorators";

export const TYPE = "message_channel_marked_refs";
@Entity(TYPE, {
  primaryKey: [["company_id", "workspace_id"], "type", "channel_id", "thread_id", "message_id"],
  type: TYPE,
})
export class MessageChannelMarkedRef {
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
  @Column("type", "string")
  type: "pinned";

  @Type(() => String)
  @Column("thread_id", "string")
  thread_id: string;

  @Type(() => String)
  @Column("message_id", "string")
  message_id: string;

  @Type(() => Number)
  @Column("created_at", "number")
  created_at: number;

  @Type(() => String)
  @Column("created_by", "string")
  created_by: string;
}

export type MessageChannelMarkedRefPrimaryKey = Pick<
  MessageChannelMarkedRef,
  "company_id" | "workspace_id" | "type" | "channel_id" | "thread_id" | "message_id"
>;

export function getInstance(ref: MessageChannelMarkedRef): MessageChannelMarkedRef {
  return merge(new MessageChannelMarkedRef(), ref);
}

import { Type } from "class-transformer";
import { merge } from "lodash";
import { Column, Entity } from "../../../core/platform/services/database/services/orm/decorators";

export const TYPE = "message_user_inbox_refs";
@Entity(TYPE, {
  primaryKey: [["company_id"], "user_id", "last_activity", "thread_id"],
  type: TYPE,
})
export class MessageUserInboxRef {
  @Type(() => String)
  @Column("company_id", "uuid")
  company_id: string;

  @Type(() => String)
  @Column("user_id", "string")
  user_id: string;

  @Type(() => Number)
  @Column("user_id", "number")
  last_activity: number;

  @Type(() => String)
  @Column("thread_id", "string")
  thread_id: string;

  @Type(() => String)
  @Column("workspace_id", "string")
  workspace_id: string;

  @Type(() => String)
  @Column("channel_id", "string")
  channel_id: string;
}

export type MessageUserInboxRefPrimaryKey = Pick<
  MessageUserInboxRef,
  "company_id" | "user_id" | "last_activity" | "thread_id"
>;

export function getInstance(ref: MessageUserInboxRef): MessageUserInboxRef {
  return merge(new MessageUserInboxRef(), ref);
}

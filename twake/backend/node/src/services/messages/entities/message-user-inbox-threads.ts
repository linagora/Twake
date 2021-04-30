import { Type } from "class-transformer";
import { merge } from "lodash";
import { Column, Entity } from "../../../core/platform/services/database/services/orm/decorators";

export const TYPE = "message_user_inbox_threads";
@Entity(TYPE, {
  primaryKey: [["company_id"], "user_id", "thread_id"],
  type: TYPE,
})
export class MessageUserInboxThread {
  @Type(() => String)
  @Column("company_id", "uuid")
  company_id: string;

  @Type(() => String)
  @Column("user_id", "string")
  user_id: string;

  @Type(() => String)
  @Column("thread_id", "string")
  thread_id: string;

  @Type(() => Number)
  @Column("user_id", "number")
  last_activity: number;
}

export type MessageUserInboxThreadPrimaryKey = Pick<
  MessageUserInboxThread,
  "company_id" | "user_id" | "thread_id"
>;

export function getInstance(ref: MessageUserInboxThread): MessageUserInboxThread {
  return merge(new MessageUserInboxThread(), ref);
}

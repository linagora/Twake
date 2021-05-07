import { Type } from "class-transformer";
import { merge } from "lodash";
import { Column, Entity } from "../../../core/platform/services/database/services/orm/decorators";

export const TYPE = "message_user_inbox_refs_reversed";
@Entity(TYPE, {
  primaryKey: [["company_id"], "user_id", "thread_id"],
  type: TYPE,
})
export class MessageUserInboxRefReversed {
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
  @Column("last_activity", "number")
  last_activity: number;
}

export type MessageUserInboxRefReversedPrimaryKey = Pick<
  MessageUserInboxRefReversed,
  "company_id" | "user_id" | "thread_id"
>;

export function getInstance(ref: MessageUserInboxRefReversed): MessageUserInboxRefReversed {
  return merge(new MessageUserInboxRefReversed(), ref);
}

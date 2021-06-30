import { Type } from "class-transformer";
import { merge } from "lodash";
import { Column, Entity } from "../../../core/platform/services/database/services/orm/decorators";

export const TYPE = "message_user_marked_refs";
@Entity(TYPE, {
  primaryKey: [["company_id"], "user_id", "bookmark_id", "id"],
  type: TYPE,
})
export class MessageUserMarkedRef {
  @Type(() => String)
  @Column("company_id", "uuid")
  company_id: string;

  @Type(() => String)
  @Column("user_id", "string")
  user_id: string;

  @Type(() => String)
  @Column("bookmark_id", "string")
  bookmark_id: string;

  @Type(() => Number)
  @Column("id", "timeuuid", { generator: "timeuuid", order: "DESC" })
  id: number;

  @Type(() => String)
  @Column("workspace_id", "string")
  workspace_id: string;

  @Type(() => String)
  @Column("channel_id", "string")
  channel_id: string;

  @Type(() => String)
  @Column("thread_id", "timeuuid")
  thread_id: string;

  @Type(() => String)
  @Column("message_id", "timeuuid")
  message_id: string;
}

export type MessageUserMarkedRefPrimaryKey = Pick<
  MessageUserMarkedRef,
  "company_id" | "user_id" | "bookmark_id" | "id"
>;

export function getInstance(ref: MessageUserMarkedRef): MessageUserMarkedRef {
  return merge(new MessageUserMarkedRef(), ref);
}

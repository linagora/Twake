import { Type } from "class-transformer";
import { merge } from "lodash";
import { Column, Entity } from "../../../core/platform/services/database/services/orm/decorators";

export const TYPE = "messages";
@Entity(TYPE, {
  primaryKey: [["company_id", "thread_id"], "message_id"],
  type: TYPE,
})
export class Message {
  @Type(() => String)
  @Column("company_id", "uuid")
  company_id: string;

  @Type(() => String)
  @Column("thread_id", "timeuuid")
  thread_id: string;

  @Type(() => String)
  @Column("message_id", "timeuuid", { generator: "timeuuid" })
  message_id: string;

  //TODO
}

export type MessagePrimaryKey = Pick<Message, "company_id" | "thread_id" | "message_id">;

export function getInstance(message: Message): Message {
  return merge(new Message(), message);
}

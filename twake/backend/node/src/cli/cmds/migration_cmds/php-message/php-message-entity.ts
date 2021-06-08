import { Type } from "class-transformer";
import { merge } from "lodash";
import {
  Column,
  Entity,
} from "../../../../core/platform/services/database/services/orm/decorators";

export const TYPE = "message";
@Entity(TYPE, {
  primaryKey: [["channel_id"], "parent_message_id", "id"],
  type: TYPE,
})
export class PhpMessage {
  @Type(() => String)
  @Column("id", "timeuuid", { generator: "timeuuid" })
  id: string;

  @Type(() => String)
  @Column("channel_id", "timeuuid")
  channel_id: string;

  @Type(() => String)
  @Column("parent_message_id", "encoded_string")
  parent_message_id: string;

  @Type(() => String)
  @Column("application_id", "encoded_string")
  application_id: string | null;

  @Column("modification_date", "number")
  modification_date: number | null;

  @Column("creation_date", "number")
  creation_date: number;

  @Column("message_type", "number")
  message_type: number;

  @Column("sender_id", "timeuuid")
  sender: string;

  @Column("content", "encoded_json")
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  content: { [key: string]: any } | null;

  @Column("hidden_data", "encoded_json")
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  hidden_data: { [key: string]: any } | null;

  @Column("reactions", "encoded_string")
  reactions: string | null;

  @Column("responses_count", "twake_int")
  responses_count: number | null;
}

export type PhpMessagePrimaryKey = Pick<PhpMessage, "parent_message_id" | "channel_id" | "id">;

export function getInstance(message: PhpMessage): PhpMessage {
  return merge(new PhpMessage(), message);
}

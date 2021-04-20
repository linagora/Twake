import { Type } from "class-transformer";
import { merge } from "lodash";
import { Column, Entity } from "../../../core/platform/services/database/services/orm/decorators";
import { Block } from "../blocks-types";

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

  @Type(() => String)
  @Column("type", "encoded_string")
  type:
    | "message" // Classic message
    | "event"; // Hidden system events

  @Column("subtype", "encoded_string")
  subtype:
    | null
    | "application" //Message from a connector
    | "deleted" //Message deleted by user
    | "system"; // Message from system (channel activity)

  @Type(() => Number)
  @Column("created_at", "number")
  created_at: number;

  @Type(() => String)
  @Column("user_id", "uuid")
  user_id: string;

  @Column("application_id", "encoded_string")
  application_id: null | string;

  @Type(() => String)
  @Column("text", "encoded_string")
  text: string;

  @Column("blocks", "encoded_json")
  blocks: Block[];

  @Column("files", "encoded_json")
  files: null | string[];

  @Column("context", "encoded_json")
  context: any;

  @Column("edited", "encoded_json")
  edited: null | MessageEdited;

  @Column("pinned_info", "encoded_json")
  pinned_info: null | MessagePinnedInfo;

  @Column("reactions", "encoded_json")
  reactions: null | MessageReaction[];

  @Column("override", "encoded_json")
  override: null | MessageOverride;
}

export type MessageReaction = { count: number; name: string; users: string[] };

export type MessageOverride = { title?: string; picture?: string };

export type MessagePinnedInfo = { pinned_at: number; pinned_by: string };

export type MessageEdited = { edited_at: number };

export type MessagePrimaryKey = Pick<Message, "company_id" | "thread_id" | "message_id">;

export function getInstance(message: Message): Message {
  return merge(new Message(), message);
}

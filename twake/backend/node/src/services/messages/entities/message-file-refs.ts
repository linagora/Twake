import { Type } from "class-transformer";
import { merge } from "lodash";
import { Column, Entity } from "../../../core/platform/services/database/services/orm/decorators";

export const TYPE = "message_file_refs";
@Entity(TYPE, {
  primaryKey: [["target_type", "company_id", "target_id"], "id"],
  type: TYPE,
})
export class MessageFileRef {
  @Type(() => String)
  @Column("target_type", "string")
  target_type: "channel" | "channel_media" | "channel_file" | "user_upload" | "user_download";

  @Type(() => String)
  @Column("target_id", "string")
  target_id: string;

  @Type(() => String)
  @Column("id", "timeuuid", { generator: "timeuuid", order: "DESC" })
  id: string;

  @Type(() => Number)
  @Column("created_at", "number")
  created_at: number;

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

  @Type(() => String)
  @Column("message_file_id", "string")
  message_file_id: string;

  @Type(() => String)
  @Column("file_id", "json")
  file_id: string;

  @Column("company_id", "timeuuid")
  company_id: string;
}

export type MessageFileRefPrimaryKey = Pick<MessageFileRef, "target_type" | "target_id" | "id">;

export function getInstance(ref: MessageFileRef): MessageFileRef {
  return merge(new MessageFileRef(), ref);
}

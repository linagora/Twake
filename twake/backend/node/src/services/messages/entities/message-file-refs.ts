import { Type } from "class-transformer";
import { merge } from "lodash";
import { Column, Entity } from "../../../core/platform/services/database/services/orm/decorators";

export const TYPE = "message_file_refs";
@Entity(TYPE, {
  primaryKey: [["company_id", "target_type"], "target_id", "id"],
  type: TYPE,
})
export class MessageFileRef {
  @Type(() => String)
  @Column("company_id", "uuid")
  company_id: string;

  @Type(() => String)
  @Column("target_type", "string")
  target_type: "channel" | "user_upload" | "user_download";

  @Type(() => String)
  @Column("target_id", "string")
  target_id: string;

  @Type(() => String)
  @Column("id", "timeuuid", { generator: "timeuuid" })
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
  @Column("file_id", "string")
  file_id: string;
}

export type MessageFileRefPrimaryKey = Pick<
  MessageFileRef,
  "company_id" | "target_type" | "target_id" | "id"
>;

export function getInstance(ref: MessageFileRef): MessageFileRef {
  return merge(new MessageFileRef(), ref);
}

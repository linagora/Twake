import { Type } from "class-transformer";
import { merge } from "lodash";
import { Thumbnail } from "../../files/entities/file";
import { Column, Entity } from "../../../core/platform/services/database/services/orm/decorators";

export const TYPE = "message_files";
@Entity(TYPE, {
  primaryKey: [["message_id"], "id"],
  type: TYPE,
})
export class MessageFile {
  @Type(() => String)
  @Column("message_id", "timeuuid", { order: "DESC" })
  message_id?: string;

  @Type(() => String)
  @Column("id", "timeuuid", { order: "DESC" })
  id: string;

  @Type(() => String)
  @Column("thread_id", "string")
  thread_id?: string;

  @Column("company_id", "timeuuid")
  company_id: string;

  @Column("metadata", "encoded_json")
  metadata: MessageFileMetadata;
}

export type MessageFileMetadata = {
  source: "internal" | "drive" | string; //Uuid of the corresponding connector
  external_id: string | any;

  name?: string; //Original file name
  mime?: string; //Original file mime
  size?: number; //Original file weight
  thumbnails?: Thumbnail[]; //Url to thumbnail (or set it to undefined if no relevant)
  type?: string;
};

export type MessageFilePrimaryKey = Pick<MessageFile, "message_id" | "id">;

export function getInstance(file: MessageFile): MessageFile {
  return merge(new MessageFile(), file);
}

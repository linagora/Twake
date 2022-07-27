import { Type } from "class-transformer";
import { merge } from "lodash";
import { Thumbnail } from "../../files/entities/file";
import { Column, Entity } from "../../../core/platform/services/database/services/orm/decorators";
import search from "./message-files.search";

export const TYPE = "message_files";
@Entity(TYPE, {
  primaryKey: [["message_id"], "id"],
  type: TYPE,
  search,
})
export class MessageFile {
  @Type(() => String)
  @Column("message_id", "timeuuid", { order: "DESC" })
  message_id?: string;

  //Timeuuid is used please do not change to uuid
  @Type(() => String)
  @Column("id", "timeuuid", { order: "DESC" })
  id: string;

  @Type(() => String)
  @Column("thread_id", "string")
  thread_id?: string;

  @Column("company_id", "timeuuid")
  company_id: string;

  @Column("created_at", "number")
  created_at: number;

  @Column("metadata", "encoded_json")
  metadata: MessageFileMetadata;

  @Column("cache", "encoded_json")
  cache: null | {
    company_id: string;
    workspace_id: string;
    channel_id: string;
    user_id: string;
  };
}

export type MessageFileMetadata = {
  source: "internal" | "drive" | string; //Uuid of the corresponding connector
  external_id: string | any;

  name?: string; //Original file name
  mime?: string; //Original file mime
  size?: number; //Original file weight
  thumbnails?: Thumbnail[]; //Url to thumbnail (or set it to undefined if no relevant)
};

export type MessageFilePrimaryKey = Pick<MessageFile, "message_id" | "id">;

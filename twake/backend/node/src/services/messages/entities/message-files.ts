import { Type } from "class-transformer";
import { merge } from "lodash";
import { Column, Entity } from "../../../core/platform/services/database/services/orm/decorators";

export const TYPE = "message_files";
@Entity(TYPE, {
  primaryKey: [["company_id"], "message_id", "id"],
  type: TYPE,
})
export class MessageFile {
  @Type(() => String)
  @Column("company_id", "uuid")
  company_id: string;

  @Type(() => String)
  @Column("message_id", "timeuuid")
  message_id: string;

  @Type(() => String)
  @Column("id", "timeuuid")
  id: string;

  @Column("id", "encoded_json")
  metadata: MessageFileMetadata;
}

export type MessageFileMetadata = {
  source: "internal" | "drive" | string; //Uuid of the corresponding connector
  external_id: string;

  name: string; //Original file name
  extension: string; //Original file extension
  size: number; //Original file weight
  width: number; //Thumbnail width (for images only)
  height: number; //Thumbnail height (for images only)
  type:
    | "link"
    | "code"
    | "document"
    | "image"
    | "pdf"
    | "slides"
    | "sound"
    | "spreadsheet"
    | "video"
    | "archive"
    | "other";
  thumbnail: string; //Url to thumbnail (or set it to undefined if no relevant)
};

export type MessageFilePrimaryKey = Pick<MessageFile, "company_id" | "message_id" | "id">;

export function getInstance(file: MessageFile): MessageFile {
  return merge(new MessageFile(), file);
}

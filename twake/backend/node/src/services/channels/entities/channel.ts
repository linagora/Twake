import { Exclude, Type } from "class-transformer";
import { ObjectID } from "mongodb";

export enum VisibilityEnum {
  PRIVATE = "private",
  PUBLIC = "public",
  DIRECT = "direct",
}

export class Channel {
  // uuid-v4
  @Type(() => String)
  company_id: string;

  // "uuid-v4" | "direct"
  @Type(() => String)
  workspace_id: string;

  @Type(() => String)
  @Exclude({ toPlainOnly: true })
  _id: ObjectID | string;

  @Type(() => String)
  id: string;

  name: string;

  icon: string;

  description: string;

  channel_group: string;

  visibility: VisibilityEnum;

  is_default: boolean;

  archived: boolean;

  archivation_date: number;

  // uuid
  @Type(() => String)
  owner: string;
}

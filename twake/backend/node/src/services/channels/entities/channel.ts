import { ObjectID } from "mongodb";
import Uuid from "cassandra-driver"

export enum VisibilityEnum {
  PRIVATE = "private",
  PUBLIC = "public",
  DIRECT = "direct"
}

export class Channel {
  // uuid-v4
  company_id: string;

  // "uuid-v4" | "direct"
  workspace_id: string;

  _id: ObjectID | string;

  id: string;

  name: string;

  icon: string;

  description: string;

  channel_group: string;

  visibility: VisibilityEnum;

  is_default: boolean;

  archived: boolean;

  archivation_date: number;

  owner: string;
}

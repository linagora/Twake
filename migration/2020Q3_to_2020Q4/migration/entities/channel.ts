import { Type } from "class-transformer";
import { Entity } from "../services/db/orm/decorators";
import { ChannelMember } from "./channel-member";

@Entity("channels", {
  primaryKey: [["company_id", "workspace_id"], "id"],
  type: "channels",
})
export class Channel {
  // uuid-v4
  @Type(() => String)
  company_id: string;

  @Type(() => String)
  workspace_id: string;

  @Type(() => String)
  id: string;

  name: string;

  icon: string;

  description: string;

  channel_group: string;

  visibility: string;

  is_default: boolean;

  archived: boolean;

  archivation_date: number;

  // uuid
  @Type(() => String)
  owner: string;

  members: string[] = [];

  connectors: string[] = []; //list of app-ids
}

export class UserChannel extends Channel {
  user_member: ChannelMember;
}

export class UserDirectChannel extends UserChannel {
  direct_channel_members: string[];
}

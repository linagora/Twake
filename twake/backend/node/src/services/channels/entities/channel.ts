import { Type } from "class-transformer";
import { Entity, Column } from "../../../core/platform/services/database/services/orm/decorators";
import { ChannelVisibility, ChannelType } from "../types";
import { ChannelMember } from "./channel-member";
import { UserObject } from "../../user/web/types";
import { merge } from "lodash";

@Entity("channels", {
  primaryKey: [["company_id", "workspace_id"], "id"],
  type: "channels",
})
export class Channel {
  // uuid-v4
  @Type(() => String)
  @Column("company_id", "uuid", { generator: "uuid" })
  company_id: string;

  @Type(() => String)
  @Column("workspace_id", "string", { generator: "uuid" })
  workspace_id: string | ChannelType.DIRECT;

  @Type(() => String)
  @Column("id", "timeuuid", { generator: "timeuuid" })
  id: string;

  @Column("name", "encoded_string")
  name: string;

  @Column("icon", "encoded_string")
  icon: string;

  @Column("description", "encoded_string")
  description: string;

  @Column("channel_group", "encoded_string")
  channel_group: string;

  @Column("visibility", "encoded_string")
  visibility: ChannelVisibility;

  @Column("is_default", "boolean")
  is_default = false;

  @Column("archived", "boolean")
  archived = false;

  @Column("archivation_date", "number")
  archivation_date: number;

  // uuid
  @Column("owner", "uuid")
  @Type(() => String)
  owner: string;

  @Column("members", "encoded_json")
  members: string[] = [];

  @Column("connectors", "encoded_json")
  connectors: string[] = []; //list of app-ids

  @Column("updated_at", "number", { onUpsert: _ => new Date().getTime() })
  updated_at: number;

  @Column("created_at", "number", { onUpsert: d => d || new Date().getTime() })
  created_at: number;

  static isPrivateChannel(channel: Channel): boolean {
    return channel.visibility === ChannelVisibility.PRIVATE;
  }

  static isPublicChannel(channel: Channel): boolean {
    return channel.visibility === ChannelVisibility.PUBLIC;
  }

  static isDirectChannel(channel: Channel): boolean {
    return (
      channel.visibility === ChannelVisibility.DIRECT ||
      channel.workspace_id === ChannelVisibility.DIRECT
    );
  }

  static isDefaultChannel(channel: Channel): boolean {
    return channel?.is_default;
  }
}

export class UserChannel extends Channel {
  user_member: ChannelMember;
}

export class UsersIncludedChannel extends Channel {
  users: UserObject[];
}

export function getInstance(channel: Partial<Channel>): Channel {
  return merge(new Channel(), channel);
}

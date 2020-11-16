import { Type } from "class-transformer";
import { ChannelVisibility, ChannelType } from "../types";
export class Channel {
  // uuid-v4
  @Type(() => String)
  company_id: string;

  // "uuid-v4" | "direct"
  @Type(() => String)
  workspace_id: string | ChannelType.DIRECT;

  @Type(() => String)
  id: string;

  name: string;

  icon: string;

  description: string;

  channel_group: string;

  visibility: ChannelVisibility;

  is_default: boolean;

  archived: boolean;

  archivation_date: number;

  // uuid
  @Type(() => String)
  owner: string;

  static isDirect(channel: Channel): boolean {
    return channel.workspace_id === ChannelType.DIRECT;
  }
}

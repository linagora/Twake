import { Type } from "class-transformer";
import { ChannelMemberNotificationLevel, ChannelMemberType } from "../types";

/**
 * Defines the member <-> channel link and member settings in channel
 */
export class ChannelMember {
  /**
   * Primary key
   */
  @Type(() => String)
  company_id: string;

  /**
   * Primary key
   * Null for direct channels
   */
  @Type(() => String)
  workspace_id: string;

  /**
   * Primary key
   */
  @Type(() => String)
  user_id: string;

  /**
   * Primary key
   */
  @Type(() => String)
  channel_id: string;

  type: ChannelMemberType = ChannelMemberType.MEMBER;

  /**
   * Timestamp in secconds
   */
  last_access: number;

  /**
   * When last updated
   */
  last_increment: number;

  /**
   * Member marked this channel as favorite?
   */
  favorite = false;

  /**
   * Member defined the notification level for the channel
   * Defaults to all
   */
  notification_level: ChannelMemberNotificationLevel = ChannelMemberNotificationLevel.MENTIONS;

  /**
   * Member expiration in channel (only for guests)
   */
  expiration: boolean | number;

  /**
   * Every collection entity must have an id, here it is the user_id
   */
  @Type(() => String)
  id: string;
}

export type ChannelMemberPrimaryKey = Pick<
  ChannelMember,
  "channel_id" | "company_id" | "user_id" | "workspace_id"
>;

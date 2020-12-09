import { Type } from "class-transformer";
import { ChannelMemberNotificationLevel } from "../../../services/channels/types";

/**
 * Table: channel_members_notification_preferences
 */
export class ChannelMemberNotificationPreference {
  /**
   * UUIDv4
   * Primary key / partition key
   */
  @Type(() => String)
  company_id: string;

  /**
   * UUIDv4
   * Primary key
   */
  @Type(() => String)
  channel_id: string;

  /**
   * UUIDv4
   * Primary key
   */
  @Type(() => String)
  user_id: string;

  @Type(() => String)
  preferences: ChannelMemberNotificationLevel = ChannelMemberNotificationLevel.ALL;

  last_read: number;
}

export type ChannelMemberNotificationPreferencePrimaryKey = Pick<
  ChannelMemberNotificationPreference,
  "company_id" | "channel_id" | "user_id"
>;

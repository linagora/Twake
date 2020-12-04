import { Type } from "class-transformer";
import { ChannelType } from "../../types";

/**
 * Table user-notification-badges
 */
export class UserNotificationBadge {
  /**
   * UUIDv4
   * Primary key / partition key
   */
  @Type(() => String)
  user_id: string;

  /**
   * UUIDv4
   * Primary key
   */
  @Type(() => String)
  company_id: string;

  /**
   * Text
   * Primary key
   */
  @Type(() => String)
  workspace_id: string | ChannelType.DIRECT;

  /**
   * UUIDv4
   * Primary key
   */
  @Type(() => String)
  channel_id: string;

  message_count = 0;
}

export type UserNotificationBadgePrimaryKey = Pick<
  UserNotificationBadge,
  "user_id" | "company_id" | "workspace_id" | "channel_id"
>;

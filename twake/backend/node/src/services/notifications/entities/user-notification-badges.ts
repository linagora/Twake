import { Type } from "class-transformer";
import { ChannelType } from "../../types";
import { Column, Entity } from "../../../core/platform/services/database/services/orm/decorators";

export const TYPE = "user_notification_badges";
/**
 * Table user-notification-badges
 */
@Entity(TYPE, {
  primaryKey: [["company_id"], "user_id", "workspace_id", "channel_id", "thread_id"],
  type: TYPE,
})
export class UserNotificationBadge {
  /**
   * UUIDv4
   * Primary key / partition key
   */
  @Type(() => String)
  @Column("company_id", "uuid")
  company_id: string;

  /**
   * UUIDv4
   */
  @Type(() => String)
  @Column("user_id", "uuid")
  user_id: string;

  /**
   * Text
   * Primary key
   */
  @Type(() => String)
  @Column("workspace_id", "string")
  workspace_id: string | ChannelType.DIRECT;

  /**
   * UUIDv4
   * Primary key
   */
  @Type(() => String)
  @Column("channel_id", "uuid")
  channel_id: string;

  /**
   * UUIDv4
   * Primary key
   */
  @Type(() => String)
  @Column("thread_id", "string") //It can be null
  thread_id: string;
}

export type UserNotificationBadgePrimaryKey = Pick<
  UserNotificationBadge,
  "user_id" | "company_id" | "workspace_id" | "channel_id" | "thread_id"
>;

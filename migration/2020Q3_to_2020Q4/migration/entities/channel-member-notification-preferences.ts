import { Type } from "class-transformer";
import { Column, Entity } from "../services/db/orm/decorators";

export enum ChannelMemberNotificationLevel {
  // be notified on all messages
  ALL = "all",
  // Only be notified on @user, @all, @here, @everyone mentions
  MENTIONS = "mentions",
  // Only be notified on @user mention
  ME = "me",
  // do not be notified at all even when someone mention user, not on direct channels
  NONE = "none",
}

export const TYPE = "channel_members_notification_preferences";
@Entity(TYPE, {
  primaryKey: [["company_id", "channel_id"], "user_id"],
  type: TYPE,
})
export class ChannelMemberNotificationPreference {
  /**
   * Primary key / Partition key
   */
  @Type(() => String)
  @Column("user_id", "uuid")
  user_id: string;

  /**
   * Primary key
   */
  @Type(() => String)
  @Column("company_id", "uuid")
  company_id: string;

  /**
   * Primary key
   */
  @Type(() => String)
  @Column("channel_id", "uuid")
  channel_id: string;

  @Type(() => String)
  @Column("preferences", "string")
  preferences: ChannelMemberNotificationLevel =
    ChannelMemberNotificationLevel.ALL;

  @Column("last_read", "number")
  last_read = 0;
}

export type ChannelMemberNotificationPreferencePrimaryKey = Pick<
  ChannelMemberNotificationPreference,
  "company_id" | "channel_id" | "user_id"
>;

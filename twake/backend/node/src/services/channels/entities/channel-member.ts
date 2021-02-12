import { Type } from "class-transformer";
import { merge } from "lodash";
import { Entity, Column } from "../../../core/platform/services/database/services/orm/decorators";
import { ChannelMemberNotificationLevel, ChannelMemberType } from "../types";

/**
 * Defines the member <-> channel link and member settings in channel
 * Table name is `user_channels`
 */
@Entity("channel_member", {
  primaryKey: [["company_id", "workspace_id"], "user_id", "channel_id"],
  type: "channel_member",
})
export class ChannelMember {
  /**
   * Primary key
   */
  @Type(() => String)
  @Column("company_id", "uuid", { generator: "uuid" })
  company_id: string;

  /**
   * Primary key
   * Null for direct channels
   */
  @Type(() => String)
  @Column("workspace_id", "string")
  workspace_id: string;

  /**
   * Primary key
   */
  @Type(() => String)
  @Column("user_id", "uuid")
  user_id: string;

  /**
   * Primary key
   */
  @Type(() => String)
  @Column("channel_id", "uuid")
  channel_id: string;

  @Column("type", "string")
  type: ChannelMemberType = ChannelMemberType.MEMBER;

  /**
   * Timestamp in secconds
   */
  @Column("last_access", "number")
  last_access: number;

  /**
   * When last updated
   */
  @Column("last_increment", "number")
  last_increment: number;

  /**
   * Member marked this channel as favorite?
   */
  @Column("favorite", "boolean")
  favorite = false;

  /**
   * Member defined the notification level for the channel
   * Defaults to all
   */
  @Column("notification_level", "string")
  notification_level: ChannelMemberNotificationLevel = ChannelMemberNotificationLevel.MENTIONS;

  /**
   * Member expiration in channel (only for guests)
   */
  @Column("expiration", "number")
  expiration: boolean | number;

  /**
   * Every collection entity must have an id, here it is the user_id
   */
  @Type(() => String)
  @Column("id", "string")
  id: string;
}

export type ChannelMemberPrimaryKey = Pick<
  ChannelMember,
  "channel_id" | "company_id" | "user_id" | "workspace_id"
>;

export function getChannelMemberInstance(member: Partial<ChannelMember>): ChannelMember {
  return merge(new ChannelMember(), member);
}

/**
 * The channel_members table allows to get all the members of a channel
 */
@Entity("member_of_channel", {
  primaryKey: [["company_id", "workspace_id"], "channel_id", "user_id"],
  type: "member_of_channel",
})
export class MemberOfChannel {
  /**
   * Primary key
   */
  @Type(() => String)
  @Column("company_id", "uuid", { generator: "uuid" })
  company_id: string;

  @Type(() => String)
  @Column("workspace_id", "string")
  workspace_id: string;

  @Type(() => String)
  @Column("user_id", "uuid")
  user_id: string;

  @Type(() => String)
  @Column("channel_id", "uuid")
  channel_id: string;

  @Column("type", "string")
  type: ChannelMemberType = ChannelMemberType.MEMBER;
}

export function getMemberOfChannelInstance(member: Partial<MemberOfChannel>): MemberOfChannel {
  return merge(new MemberOfChannel(), member);
}

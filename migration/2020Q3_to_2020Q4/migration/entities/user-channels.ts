import { Type } from "class-transformer";
import { Column, Entity } from "../services/db/orm/decorators";

/**
 * Defines the member <-> channel link and member settings in channel
 */

@Entity("user_channels", {
  primaryKey: [["company_id", "workspace_id"], "user_id", "channel_id"],
  type: "user_channels",
})
export class UserChannel {
  /**
   * Primary key
   */
  @Type(() => String)
  @Column("company_id", "uuid")
  company_id: string;

  /**
   * Primary key
   * Null for direct channels
   */
  @Type(() => String)
  @Column("workspace_id", "plainstring")
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

  @Column("type", "plainstring")
  type: string;

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
  notification_level: string;

  /**
   * Member expiration in channel (only for guests)
   */
  @Column("expiration", "number")
  expiration: boolean | number;
}

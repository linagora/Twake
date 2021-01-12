import { Type } from "class-transformer";
import { Column, Entity } from "../services/db/orm/decorators";

/**
 * Defines the member <-> channel link and member settings in channel
 */

@Entity("channel_members", {
  primaryKey: [["company_id", "workspace_id"], "channel_id", "user_id"],
  type: "channel_members",
})
export class ChannelMember {
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
}

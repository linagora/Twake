import { Type } from "class-transformer";
import { merge } from "lodash";
import { Entity, Column } from "../../../core/platform/services/database/services/orm/decorators";
import { ChannelMemberType } from "../types";

@Entity("channel_pending_emails", {
  primaryKey: [["company_id", "workspace_id"], "email", "channel_id"],
  type: "channel_pending_emails",
})
export class ChannelPendingEmails {
  /**
   * Primary key
   */
  @Type(() => String)
  @Column("company_id", "uuid", { generator: "uuid" })
  company_id: string;

  /**
   * Primary key
   */
  @Type(() => String)
  @Column("workspace_id", "uuid")
  workspace_id: string;

  /**
   * Primary key
   */
  @Type(() => String)
  @Column("channel_id", "uuid")
  channel_id: string;

  /**
   * Pending email
   */
  @Type(() => String)
  @Column("email", "string")
  email: string;

  /**
   * Member type
   */
  @Column("type", "string")
  type: ChannelMemberType;
}

export type ChannelGuestPrimaryKey = Pick<
  ChannelPendingEmails,
  "channel_id" | "company_id" | "workspace_id"
>;

export function getInstance(member: ChannelPendingEmails): ChannelPendingEmails {
  return merge(new ChannelPendingEmails(), member);
}

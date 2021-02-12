import { Type } from "class-transformer";
import { Channel } from ".";
import { Entity, Column } from "../../../core/platform/services/database/services/orm/decorators";
import { ChannelType } from "../types";

@Entity("channel_activity", {
  primaryKey: [["company_id", "workspace_id"], "channel_id", "last_activity"],
  type: "channel_activity",
})
export class ChannelActivity {
  // uuid-v4
  @Type(() => String)
  @Column("company_id", "string", { generator: "uuid" })
  company_id: string;

  // "uuid-v4" | "direct"
  @Type(() => String)
  @Column("workspace_id", "string", { generator: "uuid" })
  workspace_id: string | ChannelType.DIRECT;

  // uuid-v4
  @Type(() => String)
  @Column("channel_id", "string", { generator: "uuid" })
  channel_id: string;

  @Column("last_activity", "number")
  last_activity: number;

  /* Not stored in database */

  channel: Channel;

  public getChannelPrimaryKey(): Channel {
    if (this.channel) {
      return this.channel;
    }
    const channel = new Channel();
    channel.id = this.channel_id;
    channel.workspace_id = this.workspace_id;
    channel.company_id = this.company_id;
    return channel;
  }
}

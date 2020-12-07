import { Type } from "class-transformer";
import { Entity, Column } from "../../../core/platform/services/database/services/orm/decorators";
import { ChannelType } from "../types";

@Entity("channel_tab", {
  primaryKey: [["company_id", "workspace_id"], "channel_id", "id"],
})
export class ChannelTab {
  // uuid-v4
  @Type(() => String)
  @Column("company_id", "string")
  company_id: string;

  // "uuid-v4" | "direct"
  @Type(() => String)
  @Column("workspace_id", "string")
  workspace_id: string | ChannelType.DIRECT;

  // uuid-v4
  @Type(() => String)
  @Column("channel_id", "string")
  channel_id: string;

  // uuid-v4
  @Type(() => String)
  @Column("id", "string")
  id: string;

  @Column("name", "encrypted")
  name: string;

  @Column("configuration", "encrypted")
  configuration: string;

  @Column("application_id", "encrypted")
  application_id: string;

  @Column("owner", "encrypted")
  owner: string;

  @Column("col_order", "encrypted")
  order: string;
}

export type ChannelTabPrimaryKey = Pick<
  ChannelTab,
  "company_id" | "workspace_id" | "channel_id" | "id"
>;

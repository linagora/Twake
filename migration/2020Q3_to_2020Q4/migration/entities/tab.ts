import { Type } from "class-transformer";
import { Entity, Column } from "../services/db/orm/decorators";

@Entity("channel_tabs", {
  primaryKey: [["company_id", "workspace_id"], "channel_id", "id"],
  type: "channel_tabs",
})
export class ChannelTab {
  // uuid-v4
  @Type(() => String)
  @Column("company_id", "plainstring", { generator: "uuid" })
  company_id: string;

  // "uuid-v4" | "direct"
  @Type(() => String)
  @Column("workspace_id", "plainstring", { generator: "uuid" })
  workspace_id: string;

  // uuid-v4
  @Type(() => String)
  @Column("channel_id", "plainstring", { generator: "uuid" })
  channel_id: string;

  // uuid-v4
  @Type(() => String)
  @Column("id", "plainstring", { generator: "uuid" })
  id: string;

  @Column("name", "string")
  name: string;

  @Column("configuration", "json")
  configuration: string;

  @Column("application_id", "string")
  application_id: string;

  @Column("owner", "string")
  owner: string;

  @Column("col_order", "string")
  order: string;
}

export type ChannelTabPrimaryKey = Pick<
  ChannelTab,
  "company_id" | "workspace_id" | "channel_id" | "id"
>;

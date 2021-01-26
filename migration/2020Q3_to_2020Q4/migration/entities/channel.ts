import { Type } from "class-transformer";
import { Column, Entity } from "../services/db/orm/decorators";
import { ChannelMember } from "./channel-member";

@Entity("channels", {
  primaryKey: [["company_id", "workspace_id"], "id"],
  type: "channels",
})
export class Channel {
  // uuid-v4
  @Type(() => String)
  @Column("company_id", "uuid")
  company_id: string;

  @Type(() => String)
  @Column("workspace_id", "plainstring")
  workspace_id: string;

  @Type(() => String)
  @Column("id", "uuid")
  id: string;

  @Column("name", "string")
  name: string;

  @Column("icon", "string")
  icon: string;

  @Column("description", "string")
  description: string;

  @Column("channel_group", "string")
  channel_group: string;

  @Column("visibility", "string")
  visibility: string;

  @Column("is_default", "boolean")
  is_default: boolean;

  @Column("archived", "boolean")
  archived: boolean;

  @Column("archivation_date", "number")
  archivation_date: number;

  // uuid
  @Type(() => String)
  @Column("owner", "uuid")
  owner: string;

  @Column("members", "json")
  members: string[] = [];

  @Column("connectors", "json")
  connectors: string[] = []; //list of app-ids
}

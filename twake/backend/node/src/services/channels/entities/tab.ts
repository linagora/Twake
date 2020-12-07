import { Type } from "class-transformer";
import { ChannelType } from "../types";

export class ChannelTab {
  // uuid-v4
  @Type(() => String)
  company_id: string;

  // "uuid-v4" | "direct"
  @Type(() => String)
  workspace_id: string | ChannelType.DIRECT;

  // uuid-v4
  @Type(() => String)
  channel_id: string;

  // uuid-v4
  @Type(() => String)
  id: string;

  name: string;

  configuration: string;

  application_id: string;

  owner: string;

  order: string;
}

export type ChannelTabPrimaryKey = Pick<
  ChannelTab,
  "company_id" | "workspace_id" | "channel_id" | "id"
>;

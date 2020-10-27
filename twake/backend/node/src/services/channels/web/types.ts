import { VisibilityEnum } from "../entities/channel";


export interface ChannelParams {
  id?: string
}

export interface CreateChannelBody {
  creator: string,
  company_id: string,//"uuid-v4",
  workspace_id: string, //"uuid-v4" | "direct",
  id: string, //"uuid-v4"
  owner: string,//"uuid-v4", //User-id of the channel owner (invisible but used on some access restriction-
  icon: string,
  name: string,
  description: string,
  channel_group: string,
  visibility: VisibilityEnum,   //"private" | "public" | "direct",
  default: boolean, //The new members join by default this channel
  archived: boolean,
  archivation_date: number, //Timestamp
}

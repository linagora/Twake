import { Channel } from "../entities";

export declare type DirectChannel = "direct";
export declare type DeleteStatus = "success" | "error";

export interface BaseChannelsParameters {
  company_id: string;
  workspace_id: string | DirectChannel;
}

export interface ChannelParameters extends BaseChannelsParameters {
  id: string;
}

export interface PaginationQueryParameters {
  page_token?: string;
  max_results?: number;
}

export interface ChannelListQueryParameters extends PaginationQueryParameters {
  search_query?: string;
  mine?: boolean;
  websockets?: boolean;
}

export class ChannelListResponse {
  websockets: ChannelWebsocket[];
  resources: Channel[];
  next_page_token: string;
}

export class ChannelGetResponse {
  websocket?: ChannelWebsocket;
  resource: Channel;
}
export class ChannelCreateResponse {
  websocket?: ChannelWebsocket;
  resource: Channel;
}

export class ChannelDeleteResponse {
  status: DeleteStatus;
}

export interface ChannelWebsocket {
  name: string;
  room: string;
  encryption_key: string;
}

export class CreateChannelBody {
  creator: string;
  name: string;
  icon: string;
  description: string;
  channel_groupe: string;
  visibility: string;
  defaut: string;
  archived: string;
}

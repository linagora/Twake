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
  max_results?: string;
}

export interface ChannelListQueryParameters extends PaginationQueryParameters {
  search_query?: string;
  mine?: boolean;
  websockets?: boolean;
}

export class ChannelListResponse {
  resources: Channel[];
  websockets?: ChannelWebsocket[];
  next_page_token?: string;
}

export class ChannelGetResponse {
  websocket?: ChannelWebsocket;
  resource: Channel;
}
export class ChannelCreateResponse {
  websocket?: ChannelWebsocket;
  resource: Channel;
}

export class ChannelUpdateResponse {
  websocket?: ChannelWebsocket;
  resource: Channel;
}

export class ChannelDeleteResponse {
  status: DeleteStatus;
}

export interface ChannelWebsocket {
  room: string;
  encryption_key?: string;
}

export class CreateChannelBody {
  resource: ChannelCreateResource;
}

export class UpdateChannelBody {
  resource: ChannelUpdateResource;
}

export type ChannelCreateResource = Pick<Channel, "name">;

export type ChannelUpdateResource = Pick<Channel, "name">;

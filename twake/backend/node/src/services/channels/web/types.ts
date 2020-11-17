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

export interface ChannelMemberParameters extends ChannelParameters {
  member_id: string;
}

export interface PaginationQueryParameters {
  page_token?: string;
  limit?: string;
  websockets?: boolean;
}

export interface ChannelListQueryParameters extends PaginationQueryParameters {
  search_query?: string;
  mine?: boolean;
}

export class ChannelListResponse<T> {
  resources: T[];
  websockets?: ChannelWebsocket[];
  next_page_token?: string;
}

export class ChannelGetResponse<T> {
  websocket?: ChannelWebsocket;
  resource: T;
}
export class ChannelCreateResponse<T> {
  websocket?: ChannelWebsocket;
  resource: T;
}

export class ChannelUpdateResponse<T> {
  websocket?: ChannelWebsocket;
  resource: T;
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

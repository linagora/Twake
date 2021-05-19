/**
 * Common types for business services
 */

import {
  ChannelMember,
  Channel as ChannelEntity,
  ChannelTab,
  ChannelPendingEmails,
} from "../channels/entities";
import { ChannelParameters, PaginationQueryParameters } from "../channels/web/types";
import { MessageNotification } from "../messages/types";

export type uuid = string;

export const webSocketSchema = {
  type: "object",
  properties: {
    name: { type: "string" },
    room: { type: "string" },
    encryption_key: { type: "string" },
  },
};

/**
 * User in platform:
 *
 * {
 *    id: "uuid",
 * }
 */
export interface User {
  // unique user id
  id: uuid;
  // unique console user id
  identity_provider_id?: uuid;
  // user email
  email?: string;
  // server request
  server_request?: boolean; //Set to true if request if from the user, can be used to cancel any access restriction
  // application call
  application_id?: string;
}

export interface Workspace {
  company_id: string;
  workspace_id: string;
}

export interface Channel extends Workspace {
  id: string;
}

export interface WebsocketMetadata {
  room: string;
  name?: string;
  encryption_key?: string;
}

export enum ChannelType {
  DIRECT = "direct",
}

export class ResourceListResponse<T> {
  resources: T[];
  websockets?: ResourceWebsocket[];
  next_page_token?: string;
}

export class ResourceGetResponse<T> {
  websocket?: ResourceWebsocket;
  resource: T;
}
export class ResourceUpdateResponse<T> {
  websocket?: ResourceWebsocket;
  resource: T;
}
export class ResourceCreateResponse<T> {
  websocket?: ResourceWebsocket;
  resource: T;
}

export class ResourceDeleteResponse {
  status: DeleteStatus;
}

export interface ResourceListQueryParameters extends PaginationQueryParameters {
  search_query?: string;
  mine?: boolean;
}

export declare type DeleteStatus = "success" | "error";
export interface ResourceWebsocket {
  room: string;
  encryption_key?: string;
}

export interface ResourceEventsPayload {
  user?: User;
  channel?: ChannelEntity;
  channelParameters?: ChannelParameters;
  guest?: ChannelPendingEmails;
  member?: ChannelMember;
  message?: MessageNotification;
  actor?: User;
  resourcesBefore?: (User | ChannelEntity | ChannelTab)[];
  resourcesAfter?: (User | ChannelEntity | ChannelTab)[];
  tab?: ChannelTab;
  company?: { id: string };
}

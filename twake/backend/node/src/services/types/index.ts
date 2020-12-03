/**
 * Common types for business services
 */

import { PaginationQueryParameters } from "../channels/web/types";

/**
 * User in platform:
 *
 * {
 *    id: "uuid",
 *    org: {
 *      "company-uuid": {
 *        role: "something",
 *        wks: {
 *          "workspace-id1": {
 *            adm: true
 *          },
 *          "workspace-id2": {
 *            adm: false
 *          }
 *        }
 *      }
 *    }
 * }
 */
export interface User {
  // unique user id
  id: string;
  // Organisation properties
  org?: {
    [companyId: string]: {
      role: string; //Not implemented
      wks: {
        [workspaceId: string]: {
          adm: boolean;
        };
      };
    };
  };
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

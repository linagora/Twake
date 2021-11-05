import { PaginationQueryParameters, uuid } from "../../../utils/types";
import { WorkspaceUserRole } from "../types";
import { CompanyUserRole, UserObject } from "../../user/web/types";

export interface WorkspaceRequest extends WorkspaceBaseRequest {
  id: uuid;
}

export interface WorkspaceBaseRequest {
  company_id: uuid;
}

export interface WorkspaceUsersBaseRequest extends WorkspaceBaseRequest {
  workspace_id: uuid;
}

export interface WorkspacesListRequest extends WorkspaceBaseRequest, PaginationQueryParameters {}

export interface WorkspaceUsersRequest extends WorkspaceUsersBaseRequest {
  user_id: uuid;
}

export interface WorkspacePendingUserRequest extends WorkspaceUsersBaseRequest {
  email: string;
}

export interface WorkspaceUsersAddBody {
  resource: {
    user_id: uuid;
    role: WorkspaceUserRole;
  };
}

export interface WorkspaceUsersInvitationItem {
  email: string;
  role: WorkspaceUserRole;
  company_role: CompanyUserRole;
  password?: string;
}

export interface WorkspaceUsersInvitationRequestBody {
  invitations: WorkspaceUsersInvitationItem[];
}

export interface WorkspaceUserInvitationResponseItem {
  email: string;
  status: "ok" | "error";
  message?: string;
}

export interface WorkspaceUserInvitationResponse {
  resources: WorkspaceUserInvitationResponseItem[];
}

export type WorkspaceCreateResource = Pick<WorkspaceObject, "name" | "logo" | "default">;
export type WorkspaceUpdateResource = Pick<
  WorkspaceObject,
  "name" | "logo" | "default" | "archived"
>;

export interface CreateWorkspaceBody {
  resource: WorkspaceCreateResource;
}

export interface UpdateWorkspaceBody {
  resource: WorkspaceUpdateResource;
}

export interface WorkspaceObject {
  id: string;
  company_id: string;
  name: string;
  logo: string;

  default: boolean;
  archived: boolean;

  stats: {
    created_at: number;
    total_members: number;
  };

  role?: WorkspaceUserRole;
}

export interface WorkspaceUserObject {
  id: string;
  company_id: string;
  workspace_id: string;
  user_id: string;
  created_at: number; //Timestamp in ms
  role: WorkspaceUserRole;
  user: UserObject;
}

export interface WorkspaceInviteTokenGetRequest extends WorkspaceBaseRequest {
  workspace_id: uuid;
}

export interface WorkspaceInviteTokenDeleteRequest extends WorkspaceBaseRequest {
  workspace_id: uuid;
  token: string;
}

export interface WorkspaceInviteTokenObject {
  token: string;
}

export interface InviteTokenObject {
  c: string;
  w: string;
  t: string;
}

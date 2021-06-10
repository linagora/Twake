import { PaginationQueryParameters } from "../../../utils/types";
import { WorkspaceUserRole } from "../types";

export interface WorkspaceRequest extends WorkspaceBaseRequest {
  id: string;
}

export interface WorkspaceBaseRequest {
  company_id: string;
}

export interface WorkspacesListRequest extends WorkspaceBaseRequest, PaginationQueryParameters {}

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

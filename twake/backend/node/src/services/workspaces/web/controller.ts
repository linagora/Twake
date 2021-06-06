import { CrudController } from "../../../core/platform/services/webserver/types";
import {
  ResourceCreateResponse,
  ResourceDeleteResponse,
  ResourceGetResponse,
  ResourceListResponse,
} from "../../../utils/types";
import { WorkspaceServiceAPI } from "../api";
import { WorkspaceBaseRequest, WorkspaceObject, WorkspacesListRequest } from "./types";
import { FastifyReply, FastifyRequest } from "fastify";
import { Pagination } from "../../../core/platform/framework/api/crud-service";
import { WorkspaceExecutionContext, WorkspaceUserRole } from "../types";
import Workspace from "../entities/workspace";
import WorkspaceUser, { WorkspaceUserPrimaryKey } from "../../user/entities/workspace_user";

export class WorkspacesCrudController
  implements
    CrudController<
      ResourceGetResponse<WorkspaceObject>,
      ResourceCreateResponse<WorkspaceObject>,
      ResourceListResponse<WorkspaceObject>,
      ResourceDeleteResponse
    > {
  constructor(protected workspaceService: WorkspaceServiceAPI) {}

  private formatWorkspace(workspace: Workspace, workspaceUser?: WorkspaceUser): WorkspaceObject {
    const res: WorkspaceObject = {
      id: workspace.id,
      company_id: workspace.group_id,
      name: workspace.name,
      logo: workspace.logo,

      default: workspace.isDefault,
      archived: workspace.isArchived,

      stats: {
        created_at: workspace.dateAdded,
        total_members: 0, // FIXME
      },
    };
    if (workspaceUser) {
      res.role = workspaceUser.role;
    }

    return res;
  }

  async get(
    request: FastifyRequest<{ Querystring: WorkspaceBaseRequest }>,
    reply: FastifyReply,
  ): Promise<ResourceGetResponse<WorkspaceObject>> {
    throw new Error("Method not implemented.");
  }

  async list(
    request: FastifyRequest<{ Params: WorkspacesListRequest }>,
    reply: FastifyReply,
  ): Promise<ResourceListResponse<WorkspaceObject>> {
    const context = getExecutionContext(request);

    const allCompanyWorkspaces = await this.workspaceService.list(
      new Pagination(request.params.page_token, request.params.limit),
      {},
      context,
    );

    const allUserWorkspaces = await this.workspaceService.getAllForUser({
      userId: context.user.id,
    });

    const allUserWorkspacesHash = new Map<string, WorkspaceUser>();

    for (const uw of allUserWorkspaces.getEntities()) {
      allUserWorkspacesHash.set(uw.workspaceId, uw);
    }

    const resources: WorkspaceObject[] = [];

    for (const workspace of allCompanyWorkspaces.getEntities()) {
      resources.push(this.formatWorkspace(workspace, allUserWorkspacesHash.get(workspace.id)));
    }

    return {
      resources,
    };
  }

  async save(
    request: FastifyRequest<{ Params: WorkspaceBaseRequest }>,
    reply: FastifyReply,
  ): Promise<ResourceGetResponse<WorkspaceObject>> {
    throw new Error("Method not implemented.");
  }

  async delete(
    request: FastifyRequest<{ Params: WorkspaceBaseRequest }>,
    reply: FastifyReply,
  ): Promise<ResourceDeleteResponse> {
    throw new Error("Method not implemented.");
  }
}

function getExecutionContext(
  request: FastifyRequest<{ Params: WorkspaceBaseRequest }>,
): WorkspaceExecutionContext {
  return {
    user: request.currentUser,
    company_id: request.params.company_id,
    url: request.url,
    method: request.routerMethod,
    transport: "http",
  };
}

import { CrudController } from "../../../core/platform/services/webserver/types";
import {
  ResourceCreateResponse,
  ResourceDeleteResponse,
  ResourceGetResponse,
  ResourceListResponse,
} from "../../../utils/types";
import { WorkspaceServiceAPI } from "../api";
import {
  WorkspaceBaseRequest,
  WorkspaceObject,
  WorkspaceRequest,
  WorkspacesListRequest,
} from "./types";
import { FastifyReply, FastifyRequest } from "fastify";
import { Pagination } from "../../../core/platform/framework/api/crud-service";
import { WorkspaceExecutionContext } from "../types";
import Workspace, { WorkspacePrimaryKey } from "../entities/workspace";
import WorkspaceUser from "../../user/entities/workspace_user";
import workspace from "../../../cli/cmds/workspace";
import { CompanyService } from "../../user/services/companies/service";
import { CompaniesServiceAPI } from "../../user/api";

export class WorkspacesCrudController
  implements
    CrudController<
      ResourceGetResponse<WorkspaceObject>,
      ResourceCreateResponse<WorkspaceObject>,
      ResourceListResponse<WorkspaceObject>,
      ResourceDeleteResponse
    > {
  constructor(
    protected workspaceService: WorkspaceServiceAPI,
    protected companyService: CompaniesServiceAPI,
  ) {}

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
    request: FastifyRequest<{ Params: WorkspaceRequest }>,
    reply: FastifyReply,
  ): Promise<ResourceGetResponse<WorkspaceObject>> {
    const context = getExecutionContext(request);

    const workspace = await this.workspaceService.get({
      group_id: context.company_id,
      id: request.params.id,
    });

    if (!workspace) {
      reply.notFound(`Workspace ${request.params.id} not found`);
      return;
    }

    const workspaceUser = await this.workspaceService.getUser({
      workspaceId: request.params.id,
      userId: context.user.id,
    });

    if (!workspaceUser) {
      const companyService = await this.companyService.getCompanyUser(
        { id: context.company_id },
        { id: context.user.id },
      );

      if (companyService.role !== "admin") {
        reply.forbidden(`You are not belong to workspace ${request.params.id}`);
        return;
      }
    }

    return {
      resource: this.formatWorkspace(workspace, workspaceUser),
    };
  }

  async list(
    request: FastifyRequest<{ Params: WorkspacesListRequest }>,
    reply: FastifyReply,
  ): Promise<ResourceListResponse<WorkspaceObject>> {
    const context = getExecutionContext(request);

    const allCompanyWorkspaces = await this.workspaceService
      .list(new Pagination(request.params.page_token, request.params.limit), {}, context)
      .then(a => a.getEntities());

    const allUserWorkspacesMap = await this.workspaceService
      .getAllForUser({ userId: context.user.id }, { id: context.company_id })
      .then(uws => new Map(uws.map(uw => [uw.workspaceId, uw])));

    return {
      resources: allCompanyWorkspaces
        .filter(workspace => allUserWorkspacesMap.has(workspace.id.toString()))
        .map(ws => this.formatWorkspace(ws, allUserWorkspacesMap.get(ws.id))),
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

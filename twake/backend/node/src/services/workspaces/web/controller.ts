import { CrudController } from "../../../core/platform/services/webserver/types";
import {
  ResourceCreateResponse,
  ResourceDeleteResponse,
  ResourceGetResponse,
  ResourceListResponse,
} from "../../../utils/types";
import { WorkspaceServiceAPI } from "../api";
import {
  UpdateWorkspaceBody,
  WorkspaceBaseRequest,
  WorkspaceObject,
  WorkspaceRequest,
  WorkspacesListRequest,
} from "./types";
import { FastifyReply, FastifyRequest } from "fastify";
import { Pagination } from "../../../core/platform/framework/api/crud-service";
import { WorkspaceExecutionContext } from "../types";
import Workspace from "../entities/workspace";
import { CompaniesServiceAPI } from "../../user/api";
import CompanyUser from "../../user/entities/company_user";
import { merge } from "lodash";
import WorkspaceUser from "../entities/workspace_user";

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

  private getCompanyUser(context: WorkspaceExecutionContext) {
    return this.companyService.getCompanyUser({ id: context.company_id }, { id: context.user.id });
  }

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
      const companyUser = await this.getCompanyUser(context);

      if (!companyUser || companyUser.role !== "admin") {
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
    request: FastifyRequest<{ Params: WorkspaceRequest; Body: UpdateWorkspaceBody }>,
    reply: FastifyReply,
  ): Promise<ResourceGetResponse<WorkspaceObject>> {
    const context = getExecutionContext(request);

    const companyUser = await this.getCompanyUser(context);

    if (!companyUser) {
      reply.forbidden(`You are not a member of company ${context.company_id}`);
      return;
    }

    let workspaceEntity: Workspace;

    if (request.params.id) {
      // ON UPDATE

      workspaceEntity = await this.workspaceService.get({
        group_id: context.company_id,
        id: request.params.id,
      });

      if (!workspaceEntity) {
        reply.notFound(`Workspace ${request.params.id} not found`);
        return;
      }

      if (companyUser.role !== "admin") {
        const workspaceUserEntity = await this.workspaceService.getUser({
          workspaceId: request.params.id,
          userId: context.user.id,
        });

        if (!workspaceUserEntity || workspaceUserEntity.role !== "admin") {
          reply.forbidden("You are not a admin of workspace or company");
          return;
        }
      }

      const r = request.body.resource;

      workspaceEntity = merge(workspaceEntity, {
        name: r.name,
        logo: r.logo,
        isDefault: r.default,
        isArchived: r.archived,
      });
    } else {
      // ON CREATE

      // you must be a company admin or member to create workspaces
      if (!companyUser || !["admin", "member"].includes(companyUser.role)) {
        reply.forbidden(`You are not a member of company ${context.company_id}`);
        return;
      }

      const obj = merge(new Workspace(), request.body.resource, {
        group_id: context.company_id,
        isDefault: request.body.resource.default,
      });

      workspaceEntity = await this.workspaceService.create(obj).then(a => a.entity);
      await this.workspaceService.addUser(
        { id: workspaceEntity.id },
        { id: context.user.id },
        "admin",
      );
      reply.code(201);
    }

    const workspaceUserEntity = await this.workspaceService.getUser({
      workspaceId: workspaceEntity.id,
      userId: context.user.id,
    });

    return {
      resource: this.formatWorkspace(workspaceEntity, workspaceUserEntity),
    };
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

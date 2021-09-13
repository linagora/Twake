import { CrudController } from "../../../../core/platform/services/webserver/types";
import {
  ResourceCreateResponse,
  ResourceDeleteResponse,
  ResourceGetResponse,
  ResourceListResponse,
} from "../../../../utils/types";
import { WorkspaceServiceAPI } from "../../api";
import {
  UpdateWorkspaceBody,
  WorkspaceBaseRequest,
  WorkspaceObject,
  WorkspaceRequest,
  WorkspacesListRequest,
} from "../types";
import { FastifyReply, FastifyRequest } from "fastify";
import { Pagination } from "../../../../core/platform/framework/api/crud-service";
import Workspace from "../../entities/workspace";
import { CompaniesServiceAPI } from "../../../user/api";
import { merge } from "lodash";
import { WorkspaceExecutionContext, WorkspaceUserRole } from "../../types";
import { plainToClass } from "class-transformer";
import { hasCompanyAdminLevel, hasCompanyMemberLevel } from "../../../../utils/company";
import { hasWorkspaceAdminLevel } from "../../../../utils/workspace";

export class WorkspacesCrudController
  implements
    CrudController<
      ResourceGetResponse<WorkspaceObject>,
      ResourceCreateResponse<WorkspaceObject>,
      ResourceListResponse<WorkspaceObject>,
      ResourceDeleteResponse
    >
{
  constructor(
    protected workspaceService: WorkspaceServiceAPI,
    protected companyService: CompaniesServiceAPI,
  ) {}

  private getCompanyUserRole(context: WorkspaceExecutionContext) {
    return this.companyService
      .getCompanyUser({ id: context.company_id }, { id: context.user.id })
      .then(a => (a ? a.role : null));
  }

  private getWorkspaceUserRole(workspaceId: string, context: WorkspaceExecutionContext) {
    return this.workspaceService
      .getUser({ workspaceId, userId: context.user.id })
      .then(a => (a ? a.role : null));
  }

  private getWorkspaceUsersCount(workspaceId: string) {
    return this.workspaceService.getUsersCount(workspaceId);
  }

  private static formatWorkspace(
    workspace: Workspace,
    usersCount: number,
    role?: WorkspaceUserRole,
  ): WorkspaceObject {
    const res: WorkspaceObject = {
      id: workspace.id,
      company_id: workspace.company_id,
      name: workspace.name,
      logo: workspace.logo,

      default: workspace.isDefault,
      archived: workspace.isArchived,

      stats: {
        created_at: workspace.dateAdded,
        total_members: usersCount,
      },
    };
    if (role) {
      res.role = role;
    }

    return res;
  }

  async get(
    request: FastifyRequest<{ Params: WorkspaceRequest }>,
    reply: FastifyReply,
  ): Promise<ResourceGetResponse<WorkspaceObject>> {
    const context = getExecutionContext(request);

    const workspace = await this.workspaceService.get({
      company_id: context.company_id,
      id: request.params.id,
    });

    if (!workspace) {
      reply.notFound(`Workspace ${request.params.id} not found`);
      return;
    }

    const workspaceUserRole = await this.getWorkspaceUserRole(request.params.id, context);

    if (!workspaceUserRole) {
      const companyUserRole = await this.getCompanyUserRole(context);

      if (companyUserRole !== "admin") {
        reply.forbidden(`You are not belong to workspace ${request.params.id}`);
        return;
      }
    }
    const count = await this.getWorkspaceUsersCount(workspace.id);
    return {
      resource: WorkspacesCrudController.formatWorkspace(workspace, count, workspaceUserRole),
    };
  }

  async list(
    request: FastifyRequest<{ Params: WorkspacesListRequest }>,
  ): Promise<ResourceListResponse<WorkspaceObject>> {
    const context = getExecutionContext(request);

    const allCompanyWorkspaces = await this.workspaceService.getAllForCompany(context.company_id);

    const allUserWorkspaceRolesMap = await this.workspaceService
      .getAllForUser({ userId: context.user.id }, { id: context.company_id })
      .then(
        uws =>
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          new Map<string, any>(
            uws.map(uw => [uw.workspaceId, hasCompanyAdminLevel(uw.role) ? "moderator" : uw.role]),
          ),
      );

    const userWorkspaces = allCompanyWorkspaces.filter(workspace =>
      allUserWorkspaceRolesMap.has(workspace.id.toString()),
    );

    return {
      resources: await Promise.all(
        userWorkspaces.map(async ws =>
          WorkspacesCrudController.formatWorkspace(
            ws,
            await this.getWorkspaceUsersCount(ws.id),
            allUserWorkspaceRolesMap.get(ws.id),
          ),
        ),
      ),
    };
  }

  async save(
    request: FastifyRequest<{ Params: WorkspaceRequest; Body: UpdateWorkspaceBody }>,
    reply: FastifyReply,
  ): Promise<ResourceGetResponse<WorkspaceObject>> {
    const context = getExecutionContext(request);
    const companyUserRole = await this.getCompanyUserRole(context);

    if (!hasCompanyMemberLevel(companyUserRole)) {
      reply.forbidden(`You are not a member of company ${context.company_id}`);
      return;
    }

    if (!hasCompanyAdminLevel(companyUserRole) && request.params.id) {
      const workspaceUserRole = await this.getWorkspaceUserRole(request.params.id, context);

      if (!hasWorkspaceAdminLevel(workspaceUserRole)) {
        reply.forbidden("You are not a admin of workspace or company");
        return;
      }
    }

    const r = request.body.resource;
    const entity = plainToClass(Workspace, {
      ...{
        name: r.name,
        logo: r.logo,
        isDefault: r.default,
        isArchived: r.archived,
      },
      ...{
        group_id: request.params.company_id,
        id: request.params.id,
      },
    });

    const workspaceEntity = await this.workspaceService
      .save(entity, {}, context)
      .then(a => a.entity);

    request.params.id ? reply.code(200) : reply.code(201);

    const workspaceUserRole = await this.getWorkspaceUserRole(workspaceEntity.id, context);

    return {
      resource: WorkspacesCrudController.formatWorkspace(
        workspaceEntity,
        await this.getWorkspaceUsersCount(workspaceEntity.id),
        workspaceUserRole,
      ),
    };
  }

  async delete(
    request: FastifyRequest<{ Params: WorkspaceRequest }>,
    reply: FastifyReply,
  ): Promise<ResourceDeleteResponse> {
    const context = getExecutionContext(request);

    const workspaceUserRole = await this.getWorkspaceUserRole(request.params.id, context);

    if (!hasWorkspaceAdminLevel(workspaceUserRole)) {
      const companyUserRole = await this.getCompanyUserRole(context);
      if (companyUserRole !== "admin") {
        reply.forbidden("You are not a admin of workspace or company");
        return;
      }
    }

    const deleteResult = await this.workspaceService.delete(
      { id: request.params.id, company_id: context.company_id },
      context,
    );

    if (deleteResult.deleted) {
      reply.code(204);

      return {
        status: "success",
      };
    }

    return {
      status: "error",
    };
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

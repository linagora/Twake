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
import Workspace from "../../entities/workspace";
import { CompaniesServiceAPI } from "../../../user/api";
import { WorkspaceExecutionContext, WorkspaceUserRole } from "../../types";
import { plainToClass } from "class-transformer";
import { hasCompanyAdminLevel, hasCompanyMemberLevel } from "../../../../utils/company";
import { hasWorkspaceAdminLevel } from "../../../../utils/workspace";
import { getWorkspaceRooms } from "../../realtime";
import { RealtimeServiceAPI } from "../../../../core/platform/services/realtime/api";
import { CrudException } from "../../../../core/platform/framework/api/crud-service";
import CompanyUser from "../../../user/entities/company_user";

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
    protected realtime: RealtimeServiceAPI,
    protected workspaceService: WorkspaceServiceAPI,
    protected companyService: CompaniesServiceAPI,
  ) {}

  private getCompanyUserRole(context: WorkspaceExecutionContext) {
    return this.companyService
      .getCompanyUser({ id: context.company_id }, { id: context.user.id })
      .then(a => (a ? a.role : null));
  }

  private getWorkspaceUserRole(workspaceId: string, userId: string) {
    return this.workspaceService
      .getUser({ workspaceId, userId })
      .then(a => (a ? a.role || "member" : null));
  }

  private getWorkspaceUsersCount(workspaceId: string) {
    return this.workspaceService.getUsersCount(workspaceId);
  }

  private async formatWorkspace(
    workspace: Workspace,
    usersCount: number,
    userId?: string,
  ): Promise<WorkspaceObject> {
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

    if (userId) {
      let role = await this.getWorkspaceUserRole(workspace.id, userId);
      if (role !== "moderator") {
        //Company admins should be workspace moderators automatically
        const companyUser: CompanyUser = await this.companyService.getCompanyUser(
          { id: workspace.company_id },
          { id: userId },
        );
        if (companyUser && hasCompanyAdminLevel(companyUser?.role)) {
          role = "moderator";
        }
      }
      res.role = role;
    }

    return res;
  }

  async thumbnail(
    request: FastifyRequest<{ Params: WorkspaceRequest }>,
    response: FastifyReply,
  ): Promise<void> {
    const data = await this.workspaceService.thumbnail(request.params.id);
    const filename = "thumbnail.png";

    response.header("Content-disposition", `inline; filename="${filename}"`);
    response.type("image/png");

    response.send(data.file);
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
      throw CrudException.notFound(`Workspace ${request.params.id} not found`);
    }

    const workspaceUserRole = await this.getWorkspaceUserRole(request.params.id, context.user.id);
    if (!workspaceUserRole) {
      const companyUserRole = await this.getCompanyUserRole(context);
      if (companyUserRole !== "admin") {
        throw CrudException.forbidden(`You are not belong to workspace ${request.params.id}`);
      }
    }

    const count = await this.getWorkspaceUsersCount(workspace.id);
    return {
      resource: await this.formatWorkspace(workspace, count, context.user.id),
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
            uws.map(uw => [
              uw.workspaceId,
              hasCompanyAdminLevel(uw.role) ? "moderator" : uw.role || "member",
            ]),
          ),
      );

    const userWorkspaces = allCompanyWorkspaces.filter(workspace =>
      allUserWorkspaceRolesMap.has(workspace.id.toString()),
    );

    return {
      resources: await Promise.all(
        userWorkspaces.map(async ws =>
          this.formatWorkspace(ws, await this.getWorkspaceUsersCount(ws.id), context.user.id),
        ),
      ),
      websockets: this.realtime.sign(getWorkspaceRooms(context), context.user.id),
    };
  }

  async save(
    request: FastifyRequest<{ Params: WorkspaceRequest; Body: UpdateWorkspaceBody }>,
    reply: FastifyReply,
  ): Promise<ResourceGetResponse<WorkspaceObject>> {
    const context = getExecutionContext(request);
    const companyUserRole = await this.getCompanyUserRole(context);

    if (!hasCompanyMemberLevel(companyUserRole)) {
      throw CrudException.forbidden(`You are not a member of company ${context.company_id}`);
    }

    if (!hasCompanyAdminLevel(companyUserRole) && request.params.id) {
      const workspaceUserRole = await this.getWorkspaceUserRole(request.params.id, context.user.id);
      const companyUserRole = await this.getCompanyUserRole(context);

      if (!hasWorkspaceAdminLevel(workspaceUserRole, companyUserRole)) {
        throw CrudException.forbidden("You are not a admin of workspace or company");
      }
    }

    const r = request.body.resource;

    let entity = await this.workspaceService.get({
      company_id: request.params.company_id,
      id: request.params.id,
    });

    if (!entity) {
      entity = plainToClass(Workspace, {
        ...{
          group_id: request.params.company_id,
          id: request.params.id,
        },
      });
    }

    entity.name = r.name;
    entity.isDefault = r.default;
    entity.isArchived = r.archived;

    const workspaceEntity = await this.workspaceService
      .save(entity, request.body.options || {}, context)
      .then(a => a.entity);

    request.params.id ? reply.code(200) : reply.code(201);

    return {
      resource: await this.formatWorkspace(
        workspaceEntity,
        await this.getWorkspaceUsersCount(workspaceEntity.id),
        context.user.id,
      ),
    };
  }

  async delete(
    request: FastifyRequest<{ Params: WorkspaceRequest }>,
    reply: FastifyReply,
  ): Promise<ResourceDeleteResponse> {
    const context = getExecutionContext(request);

    const workspaceUserRole = await this.getWorkspaceUserRole(request.params.id, context.user.id);
    const companyUserRole = await this.getCompanyUserRole(context);

    if (!hasWorkspaceAdminLevel(workspaceUserRole, companyUserRole)) {
      const companyUserRole = await this.getCompanyUserRole(context);
      if (companyUserRole !== "admin") {
        throw CrudException.forbidden("You are not a admin of workspace or company");
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

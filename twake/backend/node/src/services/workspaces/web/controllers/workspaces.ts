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
import { merge } from "lodash";
import { WorkspaceExecutionContext, WorkspaceUserRole } from "../../types";

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

  private static formatWorkspace(workspace: Workspace, role?: WorkspaceUserRole): WorkspaceObject {
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
      group_id: context.company_id,
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

    return {
      resource: WorkspacesCrudController.formatWorkspace(workspace, workspaceUserRole),
    };
  }

  async list(
    request: FastifyRequest<{ Params: WorkspacesListRequest }>,
  ): Promise<ResourceListResponse<WorkspaceObject>> {
    const context = getExecutionContext(request);

    const allCompanyWorkspaces = await this.workspaceService.getAllForCompany(context.company_id);

    const companyUser = await this.companyService.getCompanyUser(
      { id: context.company_id },
      { id: context.user.id },
    );

    const allUserWorkspaceRolesMap = await this.workspaceService
      .getAllForUser({ userId: context.user.id }, { id: context.company_id })
      .then(
        uws =>
          new Map(
            uws.map(uw => [
              uw.workspaceId,
              ["owner", "admin"].includes(companyUser.role) ? "admin" : uw.role,
            ]),
          ),
      );

    return {
      resources: allCompanyWorkspaces
        .filter(workspace => allUserWorkspaceRolesMap.has(workspace.id.toString()))
        .map(ws =>
          WorkspacesCrudController.formatWorkspace(ws, allUserWorkspaceRolesMap.get(ws.id)),
        ),
    };
  }

  async save(
    request: FastifyRequest<{ Params: WorkspaceRequest; Body: UpdateWorkspaceBody }>,
    reply: FastifyReply,
  ): Promise<ResourceGetResponse<WorkspaceObject>> {
    const context = getExecutionContext(request);

    const companyUserRole = await this.getCompanyUserRole(context);

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

      if (companyUserRole !== "admin") {
        const workspaceUserRole = await this.getWorkspaceUserRole(request.params.id, context);

        if (workspaceUserRole !== "admin") {
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
      if (!["admin", "member"].includes(companyUserRole)) {
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

    const workspaceUserRole = await this.getWorkspaceUserRole(workspaceEntity.id, context);

    return {
      resource: WorkspacesCrudController.formatWorkspace(workspaceEntity, workspaceUserRole),
    };
  }

  async delete(
    request: FastifyRequest<{ Params: WorkspaceRequest }>,
    reply: FastifyReply,
  ): Promise<ResourceDeleteResponse> {
    const context = getExecutionContext(request);

    const workspaceUserRole = await this.getWorkspaceUserRole(request.params.id, context);

    if (workspaceUserRole !== "admin") {
      const companyUserRole = await this.getCompanyUserRole(context);
      if (companyUserRole !== "admin") {
        reply.forbidden("You are not a admin of workspace or company");
        return;
      }
    }

    const deleteResult = await this.workspaceService.delete({ id: request.params.id }, context);

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

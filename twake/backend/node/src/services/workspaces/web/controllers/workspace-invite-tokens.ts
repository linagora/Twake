import { CrudController } from "../../../../core/platform/services/webserver/types";
import {
  ResourceCreateResponse,
  ResourceDeleteResponse,
  ResourceGetResponse,
  ResourceListResponse,
} from "../../../../utils/types";
import WorkspaceServicesAPI from "../../api";
import {
  WorkspaceInviteTokenDeleteRequest,
  WorkspaceInviteTokenGetRequest,
  WorkspaceInviteTokenObject,
} from "../types";
import { FastifyReply, FastifyRequest } from "fastify";

import { WorkspaceInviteTokensExecutionContext } from "../../types";
import { CrudExeption } from "../../../../core/platform/framework/api/crud-service";

export class WorkspaceInviteTokensCrudController
  implements
    CrudController<
      ResourceGetResponse<WorkspaceInviteTokenObject>,
      ResourceCreateResponse<WorkspaceInviteTokenObject>,
      ResourceListResponse<WorkspaceInviteTokenObject>,
      ResourceDeleteResponse
    >
{
  constructor(protected services: WorkspaceServicesAPI) {
    this.services = services;
  }

  async get(
    request: FastifyRequest<{ Params: WorkspaceInviteTokenGetRequest }>,
    reply: FastifyReply,
  ): Promise<ResourceGetResponse<WorkspaceInviteTokenObject>> {
    const context = getExecutionContext(request);

    const res = await this.services.workspaces.getInviteToken(
      context.company_id,
      context.workspace_id,
    );

    if (!res) {
      throw CrudExeption.notFound("Invite token not found");
    }

    return {
      resource: { token: res.token },
    };
  }

  async save(
    request: FastifyRequest<{ Params: WorkspaceInviteTokenGetRequest }>,
    reply: FastifyReply,
  ): Promise<ResourceGetResponse<WorkspaceInviteTokenObject>> {
    const context = getExecutionContext(request);

    const res = await this.services.workspaces.createInviteToken(
      context.company_id,
      context.workspace_id,
    );

    return {
      resource: { token: res.token },
    };
  }

  async delete(
    request: FastifyRequest<{ Params: WorkspaceInviteTokenDeleteRequest }>,
    reply: FastifyReply,
  ): Promise<ResourceDeleteResponse> {
    const context = getExecutionContext(request);

    const deleted = await this.services.workspaces.deleteInviteToken(
      context.company_id,
      context.workspace_id,
    );

    if (!deleted) {
      throw CrudExeption.notFound("Invite token not found");
    }

    reply.code(204);

    return {
      status: "success",
    };
  }
}

function getExecutionContext(
  request: FastifyRequest<{ Params: WorkspaceInviteTokenGetRequest }>,
): WorkspaceInviteTokensExecutionContext {
  return {
    user: request.currentUser,
    company_id: request.params.company_id,
    workspace_id: request.params.workspace_id,
    url: request.url,
    method: request.routerMethod,
    transport: "http",
  };
}

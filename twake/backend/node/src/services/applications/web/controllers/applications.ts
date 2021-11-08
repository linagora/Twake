import { FastifyReply, FastifyRequest } from "fastify";
import { ApplicationServiceAPI } from "../../api";
import { CrudController } from "../../../../core/platform/services/webserver/types";
import {
  PaginationQueryParameters,
  ResourceDeleteResponse,
  ResourceGetResponse,
  ResourceListResponse,
  ResourceUpdateResponse,
} from "../../../../utils/types";
import Application, { PublicApplication } from "../../entities/application";
import { ExecutionContext } from "../../../../core/platform/framework/api/crud-service";
export class ApplicationController
  implements
    CrudController<
      ResourceGetResponse<PublicApplication>,
      ResourceUpdateResponse<PublicApplication>,
      ResourceListResponse<PublicApplication>,
      ResourceDeleteResponse
    >
{
  constructor(protected service: ApplicationServiceAPI) {}

  async get(
    request: FastifyRequest<{ Params: { application_id: string } }>,
  ): Promise<ResourceGetResponse<PublicApplication>> {
    const context = getExecutionContext(request);
    return {
      resource: null,
    };
  }

  async list(
    request: FastifyRequest<{
      Querystring: PaginationQueryParameters & { search: string };
    }>,
  ): Promise<ResourceListResponse<PublicApplication>> {
    const context = getExecutionContext(request);
    const entities = await this.service.applications.list(
      request.query,
      { search: request.query.search },
      context,
    );
    return {
      resources: entities.getEntities(),
      next_page_token: entities.nextPage.page_token,
    };
  }

  async save(
    request: FastifyRequest<{ Params: { application_id: string }; Body: Application }>,
    reply: FastifyReply,
  ): Promise<ResourceGetResponse<PublicApplication>> {
    const context = getExecutionContext(request);

    return {
      resource: null,
    };
  }

  async delete(
    request: FastifyRequest<{ Params: { application_id: string } }>,
    reply: FastifyReply,
  ): Promise<ResourceDeleteResponse> {
    const context = getExecutionContext(request);
    const deleteResult: any = {};

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

  async event(request: FastifyRequest<{ Params: { application_id: string } }>) {
    return { error: "Not implemented (yet)" };
  }
}

function getExecutionContext(request: FastifyRequest): ExecutionContext {
  return {
    user: request.currentUser,
    url: request.url,
    method: request.routerMethod,
    transport: "http",
  };
}

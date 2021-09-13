import { FastifyReply, FastifyRequest } from "fastify";
import { CompanyExecutionContext } from "../types";
import { ApplicationServiceAPI } from "../../api";
import { CrudController } from "../../../../core/platform/services/webserver/types";
import {
  PaginationQueryParameters,
  ResourceDeleteResponse,
  ResourceGetResponse,
  ResourceListResponse,
  ResourceUpdateResponse,
} from "../../../../utils/types";
import Application from "../../entities/application";

export class CompanyApplicationController
  implements
    CrudController<
      ResourceGetResponse<Application>,
      ResourceUpdateResponse<Application>,
      ResourceListResponse<Application>,
      ResourceDeleteResponse
    >
{
  constructor(protected service: ApplicationServiceAPI) {}

  async get(
    request: FastifyRequest<{ Params: { company_id: string; application_id: string } }>,
    reply: FastifyReply,
  ): Promise<ResourceGetResponse<Application>> {
    const context = getCompanyExecutionContext(request);
    return {
      resource: null,
    };
  }

  async list(
    request: FastifyRequest<{
      Params: { company_id: string };
      Querystring: PaginationQueryParameters & { search: string };
    }>,
  ): Promise<ResourceListResponse<Application>> {
    const context = getCompanyExecutionContext(request);

    return {
      resources: [],
    };
  }

  async save(
    request: FastifyRequest<{
      Params: { company_id: string; application_id: string };
      Body: Application;
    }>,
    reply: FastifyReply,
  ): Promise<ResourceGetResponse<Application>> {
    const context = getCompanyExecutionContext(request);

    return {
      resource: null,
    };
  }

  async delete(
    request: FastifyRequest<{ Params: { company_id: string; application_id: string } }>,
    reply: FastifyReply,
  ): Promise<ResourceDeleteResponse> {
    const context = getCompanyExecutionContext(request);
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
}

function getCompanyExecutionContext(
  request: FastifyRequest<{
    Params: { company_id: string };
  }>,
): CompanyExecutionContext {
  return {
    user: request.currentUser,
    company: { id: request.params.company_id },
    url: request.url,
    method: request.routerMethod,
    reqId: request.id,
    transport: "http",
  };
}

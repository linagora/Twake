import { FastifyReply, FastifyRequest } from "fastify";

import {
  PaginationQueryParameters,
  ResourceDeleteResponse,
  ResourceGetResponse,
  ResourceListResponse,
  ResourceUpdateResponse,
} from "../../../../utils/types";
import { PublicApplicationObject } from "../../entities/application";
import { CompanyExecutionContext } from "../types";
import { CrudController } from "../../../../core/platform/services/webserver/types";
import { getCompanyApplicationRooms } from "../../realtime";
import gr from "../../../global-resolver";

export class CompanyApplicationController
  implements
    CrudController<
      ResourceGetResponse<PublicApplicationObject>,
      ResourceUpdateResponse<PublicApplicationObject>,
      ResourceListResponse<PublicApplicationObject>,
      ResourceDeleteResponse
    >
{
  async get(
    request: FastifyRequest<{ Params: { company_id: string; application_id: string } }>,
  ): Promise<ResourceGetResponse<PublicApplicationObject>> {
    const context = getCompanyExecutionContext(request);
    const resource = await gr.services.applications.companyApps.get(
      {
        application_id: request.params.application_id,
        company_id: context.company.id,
        id: undefined,
      },
      context,
    );
    return {
      resource: resource?.application,
    };
  }

  async list(
    request: FastifyRequest<{
      Params: { company_id: string };
      Querystring: PaginationQueryParameters & { search: string };
    }>,
  ): Promise<ResourceListResponse<PublicApplicationObject>> {
    const context = getCompanyExecutionContext(request);
    const resources = await gr.services.applications.companyApps.list(
      request.query,
      { search: request.query.search },
      context,
    );

    return {
      resources: resources.getEntities().map(ca => ca.application),
      next_page_token: resources.nextPage.page_token,
      websockets:
        gr.platformServices.realtime.sign(
          getCompanyApplicationRooms(request.params.company_id),
          context.user.id,
        ) || [],
    };
  }

  async save(
    request: FastifyRequest<{
      Params: { company_id: string; application_id: string };
      Body: PublicApplicationObject;
    }>,
  ): Promise<ResourceGetResponse<PublicApplicationObject>> {
    const context = getCompanyExecutionContext(request);

    const resource = await gr.services.applications.companyApps.save(
      { application_id: request.params.application_id, company_id: context.company.id },
      {},
      context,
    );

    const app = await gr.services.applications.companyApps.get(resource.entity);

    return {
      resource: app.application,
    };
  }

  async delete(
    request: FastifyRequest<{ Params: { company_id: string; application_id: string } }>,
    _reply: FastifyReply,
  ): Promise<ResourceDeleteResponse> {
    const context = getCompanyExecutionContext(request);
    const resource = await gr.services.applications.companyApps.delete(
      {
        application_id: request.params.application_id,
        company_id: context.company.id,
        id: undefined,
      },
      context,
    );
    return {
      status: resource.deleted ? "success" : "error",
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

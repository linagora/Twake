import { FastifyReply, FastifyRequest, FastifyInstance, HTTPMethods } from "fastify";
import { ApplicationsApiServiceAPI } from "../../api";
import Application, { ApplicationObject } from "../../../applications/entities/application";
import {
  ApplicationApiExecutionContext,
  ApplicationLoginRequest,
  ApplicationLoginResponse,
} from "../types";
import { ResourceGetResponse } from "../../../../utils/types";
import { logger as log } from "../../../../core/platform/framework";
import {
  CrudException,
  ExecutionContext,
} from "../../../../core/platform/framework/api/crud-service";

export class ApplicationsApiController {
  constructor(readonly service: ApplicationsApiServiceAPI) {}

  async token(
    request: FastifyRequest<{ Body: ApplicationLoginRequest }>,
  ): Promise<ResourceGetResponse<ApplicationLoginResponse>> {
    return {
      resource: {
        access_token: this.service.authService.generateJWT(request.body.id, null, {
          track: false,
          provider_id: "",
          application_id: request.body.id,
        }),
      },
    };
  }

  async me(
    request: FastifyRequest,
    reply: FastifyReply,
  ): Promise<ResourceGetResponse<ApplicationObject>> {
    const context = getExecutionContext(request);

    const entity = await this.service.applicationService.applications.get({
      id: context.application_id,
    });
    if (!entity) {
      throw CrudException.notFound("Application not found");
    }

    return { resource: entity.getApplicationObject() };
  }

  async configure(request: FastifyRequest<{}>, reply: FastifyReply) {
    return { error: "Not implemented (yet)" };
  }

  async closeConfigure(
    request: FastifyRequest<{ Params: { configuration_id: string } }>,
    reply: FastifyReply,
  ) {
    return { error: "Not implemented (yet)" };
  }

  async proxy(request: FastifyRequest<{}>, reply: FastifyReply, fastify: FastifyInstance) {
    //TODO Check application access rights (write, read, remove for each micro services)

    //TODO save some statistics about API usage

    const route = request.url.replace("/api/", "/internal/services/");

    fastify.inject(
      {
        method: request.method as HTTPMethods,
        url: route,
      },
      (err, response) => {
        reply.headers(response.headers);
        reply.send(response.payload);
      },
    );
  }
}

function getExecutionContext(request: FastifyRequest): ApplicationApiExecutionContext {
  return {
    application_id: request.currentUser.application_id,
    user: request.currentUser,
    url: request.url,
    method: request.routerMethod,
    transport: "http",
  };
}

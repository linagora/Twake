import { FastifyInstance, FastifyReply, FastifyRequest, HTTPMethods } from "fastify";
import { ApplicationObject } from "../../../applications/entities/application";
import {
  ApplicationApiExecutionContext,
  ApplicationLoginRequest,
  ApplicationLoginResponse,
  ConfigureRequest,
} from "../types";
import { ResourceGetResponse } from "../../../../utils/types";
import { CrudException } from "../../../../core/platform/framework/api/crud-service";
import { localEventBus } from "../../../../core/platform/framework/pubsub";
import {
  RealtimeApplicationEvent,
  RealtimeBaseBusEvent,
} from "../../../../core/platform/services/realtime/types";
import gr from "../../../global-resolver";

export class ApplicationsApiController {
  async token(
    request: FastifyRequest<{ Body: ApplicationLoginRequest }>,
  ): Promise<ResourceGetResponse<ApplicationLoginResponse>> {
    return {
      resource: {
        access_token: gr.platformServices.auth.generateJWT(request.body.id, null, {
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

    const entity = await gr.services.applications.get({
      id: context.application_id,
    });
    if (!entity) {
      throw CrudException.notFound("Application not found");
    }

    return { resource: entity.getApplicationObject() };
  }

  async configure(request: FastifyRequest<{ Body: ConfigureRequest }>, reply: FastifyReply) {
    const app_id = request.currentUser.application_id;

    const application = await gr.services.applications.get({ id: app_id });

    if (!application) {
      throw CrudException.forbidden("Application not found");
    }

    const body = request.body;

    const data = {
      action: "configure",
      application: {
        id: app_id,
        identity: application.identity,
      },
      form: body.form,
      connection_id: body.connection_id,
      hidden_data: {},
    };

    localEventBus.publish("realtime:event", {
      room: "/me/" + body.user_id,
      type: "application",
      data,
    } as RealtimeBaseBusEvent<RealtimeApplicationEvent>);

    return { status: "ok" };
  }

  async proxy(request: FastifyRequest, reply: FastifyReply, fastify: FastifyInstance) {
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

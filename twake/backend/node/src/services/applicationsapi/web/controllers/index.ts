import { FastifyInstance, FastifyReply, FastifyRequest, HTTPMethods } from "fastify";
import { ApplicationsApiServiceAPI } from "../../api";
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
import _ from "lodash";

export class ApplicationsApiController {
  constructor(readonly service: ApplicationsApiServiceAPI) {}

  async token(
    request: FastifyRequest<{ Body: ApplicationLoginRequest }>,
  ): Promise<ResourceGetResponse<ApplicationLoginResponse>> {
    const app = await this.service.applicationService.applications.get({
      id: request.body.id,
    });

    if (!app) {
      throw CrudException.forbidden("Application not found");
    }

    if (app.api.private_key !== request.body.secret) {
      throw CrudException.forbidden("Secret key is not valid");
    }

    const company_id = request.body.company_id;
    if (!company_id) {
      throw CrudException.forbidden("You must provide a valid company_id");
    }

    const companyApplication = this.service.applicationService.companyApplications.get({
      company_id,
      application_id: app.id,
    });

    if (!companyApplication) {
      throw CrudException.forbidden("This application is not installed in the requested company");
    }

    return {
      resource: {
        access_token: this.service.authService.generateJWT(null, null, {
          track: false,
          provider_id: "",
          application_id: request.body.id,
          access: { ...app.access, company_id },
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

  async configure(request: FastifyRequest<{ Body: ConfigureRequest }>, reply: FastifyReply) {
    const app_id = request.currentUser.application_id;

    const application = await this.service.applicationService.applications.get({ id: app_id });

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

  async proxy(request: FastifyRequest<{}>, reply: FastifyReply, fastify: FastifyInstance) {
    //TODO Check the application has access to this company

    //TODO Check application access rights (write, read, remove for each micro services)

    //TODO save some statistics about API usage

    const route = request.url.replace("/api/", "/internal/services/");

    fastify.inject(
      {
        method: request.method as HTTPMethods,
        url: route,
        payload: request.body as any,
        headers: _.pick(request.headers, "authorization"),
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

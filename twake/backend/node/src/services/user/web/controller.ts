import { FastifyReply, FastifyRequest } from "fastify";
import { ExecutionContext, Pagination } from "../../../core/platform/framework/api/crud-service";

import { CrudController } from "../../../core/platform/services/webserver/types";
import { ResourceListResponse } from "../../../services/types";
import { ResourceDeleteResponse } from "../../../services/types";
import { ResourceCreateResponse } from "../../../services/types";
import { ResourceGetResponse } from "../../../services/types";
import { UsersServiceAPI } from "../api";

import User from "../entities/user";
import { UserListQueryParameters, UserParameters } from "./types";

export class UsersCrudController implements CrudController<ResourceGetResponse<User>, ResourceCreateResponse<User>, ResourceListResponse<User>, ResourceDeleteResponse> {
  constructor(protected service: UsersServiceAPI) {}

  async get(
    request: FastifyRequest<{
      Params: UserParameters,
      Querystring: UserListQueryParameters;
    }>,
    reply: FastifyReply,
  ): Promise<ResourceGetResponse<User>> {
    const user = await this.service.get(
      {
        id: request.params.id,
      },
      getExecutionContext(request),
    );

    if (!user) {
      reply.notFound(`User ${request.params.id} not found`);

      return;
    }

    return {
      resource: user,
    };
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

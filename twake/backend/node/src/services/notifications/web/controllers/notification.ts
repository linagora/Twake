import { FastifyRequest } from "fastify";
import { CrudController } from "../../../../core/platform/services/webserver/types";
import { NotificationServiceAPI } from "../../api";
import { NotificationExecutionContext } from "../../types";
import {
  ResourceCreateResponse,
  ResourceDeleteResponse,
  ResourceGetResponse,
  ResourceListQueryParameters,
  ResourceListResponse,
} from "../../../../services/types";
import { Pagination } from "../../../../core/platform/framework/api/crud-service";
import { UserNotificationBadge } from "../../entities";

export class NotificationController
  implements
    CrudController<
      ResourceGetResponse<UserNotificationBadge>,
      ResourceCreateResponse<UserNotificationBadge>,
      ResourceListResponse<UserNotificationBadge>,
      ResourceDeleteResponse
    > {
  constructor(protected service: NotificationServiceAPI) {}

  async list(
    request: FastifyRequest<{ Querystring: ResourceListQueryParameters }>,
  ): Promise<ResourceListResponse<UserNotificationBadge>> {
    const list = await this.service.badges.list(
      new Pagination(request.query.page_token, request.query.limit),
      { ...request.query },
      getExecutionContext(request),
    );

    return {
      ...{
        resources: list.getEntities(),
      },
      ...(request.query.websockets && {
        websockets: [],
      }),
      ...(list.page_token && {
        next_page_token: list.page_token,
      }),
    };
  }
}

function getExecutionContext(request: FastifyRequest): NotificationExecutionContext {
  return {
    user: request.currentUser,
    url: request.url,
    method: request.routerMethod,
    transport: "http",
  };
}

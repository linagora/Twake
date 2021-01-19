import { FastifyRequest } from "fastify";
import { CrudController } from "../../../../core/platform/services/webserver/types";
import { CrudExeption } from "../../../../core/platform/framework/api/crud-service";
import { NotificationServiceAPI } from "../../api";
import { NotificationListQueryParameters } from "../../types";
import {
  ResourceCreateResponse,
  ResourceDeleteResponse,
  ResourceGetResponse,
  ResourceListResponse,
} from "../../../../services/types";
import { UserNotificationBadge } from "../../entities";
import { getWebsocketInformation } from "../../services/realtime";

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
    request: FastifyRequest<{ Querystring: NotificationListQueryParameters }>,
  ): Promise<ResourceListResponse<UserNotificationBadge>> {
    if (!request.query.company_id) {
      throw CrudExeption.badRequest("?company_id is required");
    }

    const list = await this.service.badges.listForUser(
      request.query.company_id,
      request.currentUser.id,
      { ...request.query },
    );

    return {
      ...{
        resources: list.getEntities(),
      },
      ...(request.query.websockets && {
        websockets: [getWebsocketInformation(request.currentUser)],
      }),
      ...(list.page_token && {
        next_page_token: list.page_token,
      }),
    };
  }
}

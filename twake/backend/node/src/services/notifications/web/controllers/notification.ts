import { FastifyRequest } from "fastify";
import { CrudController } from "../../../../core/platform/services/webserver/types";
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
    request: FastifyRequest<{
      Querystring: NotificationListQueryParameters;
    }>,
  ): Promise<ResourceListResponse<UserNotificationBadge>> {
    //Get one badge per company
    if (!request.query.company_id) {
      const list = await this.service.badges.listForUserPerCompanies(
        Object.keys(request.currentUser.org),
        request.currentUser.id,
      );
      return {
        resources: list.getEntities(),
      };
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

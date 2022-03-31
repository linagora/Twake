import { FastifyRequest } from "fastify";
import { CrudController } from "../../../../core/platform/services/webserver/types";
import { NotificationServiceAPI } from "../../api";
import { NotificationListQueryParameters } from "../../types";
import {
  ResourceCreateResponse,
  ResourceDeleteResponse,
  ResourceGetResponse,
  ResourceListResponse,
} from "../../../../utils/types";
import { UserNotificationBadge } from "../../entities";
import { getWebsocketInformation } from "../../services/realtime";
import { RealtimeServiceAPI } from "../../../../core/platform/services/realtime/api";
import { uniq } from "lodash";

export class NotificationController
  implements
    CrudController<
      ResourceGetResponse<UserNotificationBadge>,
      ResourceCreateResponse<UserNotificationBadge>,
      ResourceListResponse<UserNotificationBadge>,
      ResourceDeleteResponse
    >
{
  constructor(protected realtime: RealtimeServiceAPI, protected service: NotificationServiceAPI) {}

  async list(
    request: FastifyRequest<{
      Querystring: NotificationListQueryParameters;
    }>,
  ): Promise<ResourceListResponse<UserNotificationBadge>> {
    let resources: UserNotificationBadge[] = [];
    let page_token: string = "";

    //Get one badge per company if requested
    if (request.query.all_companies) {
      const list = await this.service.badges.listForUserPerCompanies(request.currentUser.id);
      resources = resources.concat(list.getEntities());
    }

    if (request.query.company_id) {
      const list = await this.service.badges.listForUser(
        request.query.company_id,
        request.currentUser.id,
        { ...request.query },
      );
      resources = resources.concat(list.getEntities());
      page_token = list.page_token;
    }

    return {
      ...{
        resources,
      },
      ...(request.query.websockets && {
        websockets: this.realtime.sign(
          [getWebsocketInformation(request.currentUser)],
          request.currentUser.id,
        ),
      }),
      ...(page_token && {
        next_page_token: page_token,
      }),
    };
  }
}

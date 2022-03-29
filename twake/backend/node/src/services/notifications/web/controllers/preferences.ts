import { FastifyReply, FastifyRequest } from "fastify";
import { CrudController } from "../../../../core/platform/services/webserver/types";
import { handleError } from "../../../../utils/handleError";
import {
  CreateNotificationPreferencesBody,
  NotificationPreferenceListQueryParameters,
} from "../../types";
import {
  ResourceCreateResponse,
  ResourceDeleteResponse,
  ResourceGetResponse,
  ResourceListResponse,
} from "../../../../utils/types";
import { UserNotificationPreferences } from "../../entities";
import gr from "../../../global-resolver";

const ALL = "all";

export class NotificationPrerencesController
  implements
    CrudController<
      ResourceGetResponse<UserNotificationPreferences>,
      ResourceCreateResponse<UserNotificationPreferences>,
      ResourceListResponse<UserNotificationPreferences>,
      ResourceDeleteResponse
    >
{
  async list(
    request: FastifyRequest<{
      Querystring: NotificationPreferenceListQueryParameters;
    }>,
  ): Promise<ResourceListResponse<UserNotificationPreferences>> {
    const list = await gr.services.notificationPreferences.listPreferences(
      ALL,
      ALL,
      request.currentUser.id,
      { ...request.query },
    );

    return { resources: list.getEntities() };
  }

  async save(
    request: FastifyRequest<{ Body: CreateNotificationPreferencesBody }>,
    reply: FastifyReply,
  ): Promise<ResourceCreateResponse<UserNotificationPreferences>> {
    const entity = {
      ...request.body.resource,
      ...{
        workspace_id: ALL,
        company_id: ALL,
        user_id: request.currentUser.id,
      },
    };

    try {
      const result = await gr.services.notificationPreferences.savePreferences(
        entity as UserNotificationPreferences,
      );

      if (result) {
        reply.code(201);
      }

      return {
        resource: result.entity,
      };
    } catch (err) {
      handleError(reply, err);
    }
  }
}

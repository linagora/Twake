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
import { ExecutionContext } from "../../../../core/platform/framework/api/crud-service";

const ALL = "all";

export class NotificationPreferencesController
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
    const list = await gr.services.notifications.preferences.listPreferences(
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
    context?: ExecutionContext,
  ): Promise<ResourceCreateResponse<UserNotificationPreferences>> {
    const entity = {
      workspace_id: ALL,
      company_id: ALL,
      user_id: request.currentUser.id,
      preferences: {
        ...request.body.resource,
      },
    };

    try {
      const result = await gr.services.notifications.preferences.savePreferences(
        entity as UserNotificationPreferences,
        context,
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

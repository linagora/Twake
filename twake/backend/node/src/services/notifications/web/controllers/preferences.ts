import { FastifyReply, FastifyRequest } from "fastify";
import { ExecutionContext } from "../../../../core/platform/framework/api/crud-service";
import { UserNotificationPreferences } from "../../../../services/user/entities/user";
import { handleError } from "../../../../utils/handleError";
import { ResourceCreateResponse, ResourceListResponse } from "../../../../utils/types";
import gr from "../../../global-resolver";
import { NotificationPreferenceListQueryParameters } from "../../types";

const ALL = "all";

export class NotificationPreferencesController {
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
    request: FastifyRequest<{ Body: { resource: UserNotificationPreferences } }>,
    reply: FastifyReply,
    context?: ExecutionContext,
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
      const result = await gr.services.notifications.preferences.savePreferences(
        entity as UserNotificationPreferences,
        context.user.id,
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

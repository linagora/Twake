import { FastifyReply, FastifyRequest } from "fastify";
import { CrudController } from "../../../../core/platform/services/webserver/types";
import {
  ResourceDeleteResponse,
  ResourceGetResponse,
  ResourceListResponse,
  ResourceUpdateResponse,
} from "../../../../utils/types";
import { UserMessageBookmark } from "../../entities/user-message-bookmarks";
import { handleError } from "../../../../utils/handleError";
import { CompanyExecutionContext } from "../../types";
import { getUserBookmarksWebsocketRoom } from "../realtime";
import gr from "../../../global-resolver";

export class UserBookmarksController
  implements
    CrudController<
      ResourceGetResponse<UserMessageBookmark>,
      ResourceUpdateResponse<UserMessageBookmark>,
      ResourceListResponse<UserMessageBookmark>,
      ResourceDeleteResponse
    >
{
  async save(
    request: FastifyRequest<{
      Params: {
        company_id: string;
        id: string;
      };
      Body: {
        resource: {
          name: string;
        };
      };
    }>,
    reply: FastifyReply,
  ): Promise<ResourceUpdateResponse<UserMessageBookmark>> {
    const context = getCompanyExecutionContext(request);
    try {
      const result = await gr.services.messages.userBookmarks.save(
        {
          user_id: context.user.id,
          company_id: request.params.company_id,
          name: request.body.resource.name,
          id: request.params.id || undefined,
        },
        context,
      );
      return {
        resource: result.entity,
      };
    } catch (err) {
      handleError(reply, err);
    }
  }

  async delete(
    request: FastifyRequest<{
      Params: {
        company_id: string;
        id: string;
      };
    }>,
    reply: FastifyReply,
  ): Promise<ResourceDeleteResponse> {
    const context = getCompanyExecutionContext(request);
    try {
      const result = await gr.services.messages.userBookmarks.delete(
        {
          user_id: context.user.id,
          company_id: request.params.company_id,
          id: request.params.id,
        },
        context,
      );
      return {
        status: result.deleted ? "success" : "error",
      };
    } catch (err) {
      handleError(reply, err);
    }
  }

  async list(
    request: FastifyRequest<{
      Params: {
        company_id: string;
      };
    }>,
    reply: FastifyReply,
  ): Promise<ResourceListResponse<UserMessageBookmark>> {
    const context = getCompanyExecutionContext(request);
    try {
      const list = await gr.services.messages.userBookmarks.list(
        {
          user_id: context.user.id,
          company_id: context.company.id,
        },
        context,
      );
      return {
        websockets: gr.platformServices.realtime.sign(
          [{ room: getUserBookmarksWebsocketRoom(context) }],
          context.user.id,
        ),
        resources: list.getEntities(),
        ...(list.page_token && {
          next_page_token: list.page_token,
        }),
      };
    } catch (err) {
      handleError(reply, err);
    }
  }
}

function getCompanyExecutionContext(
  request: FastifyRequest<{
    Params: { company_id: string };
  }>,
): CompanyExecutionContext {
  return {
    user: request.currentUser,
    company: { id: request.params.company_id },
    url: request.url,
    method: request.routerMethod,
    reqId: request.id,
    transport: "http",
  };
}

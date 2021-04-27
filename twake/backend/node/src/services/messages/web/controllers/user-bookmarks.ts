import { FastifyReply, FastifyRequest } from "fastify";
import { CrudController } from "../../../../core/platform/services/webserver/types";
import { MessageServiceAPI } from "../../api";
import {
  ResourceUpdateResponse,
  ResourceDeleteResponse,
  ResourceGetResponse,
  ResourceListResponse,
  ResourceWebsocket,
} from "../../../../services/types";
import { getInstance, UserMessageBookmark } from "../../entities/user-message-bookmarks";
import { ExecutionContext, SaveResult } from "../../../../core/platform/framework/api/crud-service";
import { handleError } from "../../../../utils/handleError";
import { CompanyExecutionContext } from "../../types";
import { getUserBookmarksWebsocketRoom } from "../realtime";

export class UserBookmarksController
  implements
    CrudController<
      ResourceGetResponse<UserMessageBookmark>,
      ResourceUpdateResponse<UserMessageBookmark>,
      ResourceListResponse<UserMessageBookmark>,
      ResourceDeleteResponse
    > {
  constructor(protected service: MessageServiceAPI) {}

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
      const result = await this.service.userBookmarks.save(
        {
          user_id: context.user.id,
          company_id: request.params.company_id,
          name: request.body.resource.name,
          id: request.params.id || undefined,
        },
        {},
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
      const result = await this.service.userBookmarks.delete(
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
      const list = await this.service.userBookmarks.list(
        {},
        {
          user_id: context.user.id,
          company_id: request.params.company_id,
        },
        context,
      );
      return {
        websockets: [{ room: getUserBookmarksWebsocketRoom(context) }],
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

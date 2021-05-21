import { FastifyReply, FastifyRequest } from "fastify";
import { CrudController } from "../../../../core/platform/services/webserver/types";
import { MessageServiceAPI } from "../../api";
import {
  ResourceCreateResponse,
  ResourceDeleteResponse,
  ResourceGetResponse,
  ResourceListResponse,
} from "../../../../utils/types";
import { Message } from "../../entities/messages";
import { handleError } from "../../../../utils/handleError";
import { Pagination } from "../../../../core/platform/framework/api/crud-service";
import {
  ChannelViewExecutionContext,
  MessageViewListOptions,
  PaginationQueryParameters,
  MessageWithReplies,
} from "../../types";

export class ViewsController
  implements
    CrudController<
      ResourceGetResponse<MessageWithReplies>,
      ResourceCreateResponse<MessageWithReplies>,
      ResourceListResponse<MessageWithReplies>,
      ResourceDeleteResponse
    > {
  constructor(protected service: MessageServiceAPI) {}

  async list(
    request: FastifyRequest<{
      Querystring: MessageViewListQueryParameters;
      Params: {
        company_id: string;
        workspace_id: string;
        channel_id: string;
      };
    }>,
    reply: FastifyReply,
  ): Promise<ResourceListResponse<MessageWithReplies>> {
    const context = getChannelViewExecutionContext(request);
    try {
      const resources = await this.service.views.listChannel(
        new Pagination(
          request.query.page_token,
          request.query.limit,
          request.query.direction === "history",
        ),
        { ...request.query },
        context,
      );
      return {
        resources: resources.getEntities(),
        ...(request.query.websockets && {
          websockets: [
            {
              room: `/companies/${context.channel.company_id}/workspaces/${context.channel.workspace_id}/channels/${context.channel.id}/feed`,
            },
          ],
        }),
        ...(resources.page_token && {
          next_page_token: resources.page_token,
        }),
      };
    } catch (err) {
      handleError(reply, err);
    }
  }
}

export interface MessageViewListQueryParameters
  extends PaginationQueryParameters,
    MessageViewListOptions {}

function getChannelViewExecutionContext(
  request: FastifyRequest<{
    Params: {
      company_id: string;
      workspace_id: string;
      channel_id: string;
    };
  }>,
): ChannelViewExecutionContext {
  return {
    user: request.currentUser,
    url: request.url,
    method: request.routerMethod,
    reqId: request.id,
    transport: "http",
    channel: {
      id: request.params.channel_id,
      company_id: request.params.company_id,
      workspace_id: request.params.workspace_id,
    },
  };
}

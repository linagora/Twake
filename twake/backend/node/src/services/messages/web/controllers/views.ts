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
import { ListResult, Pagination } from "../../../../core/platform/framework/api/crud-service";
import {
  ChannelViewExecutionContext,
  MessageViewListOptions,
  PaginationQueryParameters,
  MessageWithReplies,
} from "../../types";
import { keyBy } from "lodash";
import { RealtimeServiceAPI } from "../../../../core/platform/services/realtime/api";

export class ViewsController
  implements
    CrudController<
      ResourceGetResponse<MessageWithReplies>,
      ResourceCreateResponse<MessageWithReplies>,
      ResourceListResponse<MessageWithReplies>,
      ResourceDeleteResponse
    >
{
  constructor(protected realtime: RealtimeServiceAPI, protected service: MessageServiceAPI) {}

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
          request.query.direction !== "history",
        ),
        { ...request.query, include_users: request.query.include_users },
        context,
      );

      let entities = [];
      if (request.query.include_users) {
        for (const msg of resources.getEntities()) {
          entities.push(await this.service.messages.includeUsersInMessageWithReplies(msg));
        }
      } else {
        entities = resources.getEntities();
      }

      return {
        resources: entities,
        ...(request.query.websockets && {
          websockets: this.realtime.sign(
            [
              {
                room: `/companies/${context.channel.company_id}/workspaces/${context.channel.workspace_id}/channels/${context.channel.id}/feed`,
              },
            ],
            context.user.id,
          ),
        }),
        ...(resources.page_token && {
          next_page_token: resources.page_token,
        }),
      };
    } catch (err) {
      handleError(reply, err);
    }
  }

  async search(
    request: FastifyRequest<{
      Querystring: MessageViewSearchQueryParameters;
      Params: {
        company_id: string;
      };
    }>,
    context: ChannelViewExecutionContext,
  ): Promise<ResourceListResponse<MessageWithReplies>> {
    const messages: Message[] = await this.service.views
      .search(
        new Pagination(request.query.page_token, request.query.limit),
        {
          search: request.query.q,
          companyId: request.params.company_id,
        },
        context,
      )
      .then(a => a.getEntities());

    const firstMessagesMap = keyBy(
      await this.service.views.getThreadsFirstMessages(messages.map(a => a.thread_id)),
      item => item.id,
    );

    const resources = messages.map((resource: Message) => {
      const firstMessage = firstMessagesMap[resource.thread_id];
      return {
        ...firstMessage,
        last_replies: resource.id != firstMessage.id ? [resource] : [],
      } as MessageWithReplies;
    });

    return { resources };
  }
}

export interface MessageViewListQueryParameters
  extends PaginationQueryParameters,
    MessageViewListOptions {
  include_users: boolean;
}

export interface MessageViewSearchQueryParameters extends PaginationQueryParameters {
  q: string;
}

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

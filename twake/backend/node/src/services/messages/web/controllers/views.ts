import { FastifyReply, FastifyRequest } from "fastify";
import { MessageServiceAPI } from "../../api";
import { ResourceListResponse } from "../../../../utils/types";
import { Message } from "../../entities/messages";
import { handleError } from "../../../../utils/handleError";
import { ListResult, Pagination } from "../../../../core/platform/framework/api/crud-service";
import {
  ChannelViewExecutionContext,
  MessageViewListOptions,
  MessageWithReplies,
  PaginationQueryParameters,
} from "../../types";
import { keyBy } from "lodash";
import { RealtimeServiceAPI } from "../../../../core/platform/services/realtime/api";
import ChannelServiceAPI from "../../../channels/provider";

export class ViewsController {
  constructor(
    protected realtime: RealtimeServiceAPI,
    protected service: MessageServiceAPI,
    protected channelService: ChannelServiceAPI,
  ) {}

  async feed(
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
    const pagination = new Pagination(
      request.query.page_token,
      request.query.limit,
      request.query.direction !== "history",
    );
    const query = { ...request.query, include_users: request.query.include_users };
    const context = getChannelViewExecutionContext(request);

    let resources: ListResult<MessageWithReplies>;

    try {
      if (request.query.filter === "files") {
        resources = await this.service.views.listChannelFiles(pagination, query, context);
      } else if (request.query.filter === "thread") {
        resources = await this.service.views.listChannelThreads(pagination, query, context);
      } else if (request.query.filter === "pinned") {
        resources = await this.service.views.listChannelPinned(pagination, query, context);
      } else {
        resources = await this.service.views.listChannel(pagination, query, context);
      }

      if (!resources) {
        throw new Error("No list resources created");
      }

      let entities = [];
      if (request.query.include_users) {
        //Fixme, this takes a very long time
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

  // Bookmarked messages of user from all over workspace
  async bookmarks(): Promise<ResourceListResponse<MessageWithReplies>> {
    return { resources: [] };
  }

  // Uploaded and downloaded files of user from all over workspace
  async files(): Promise<ResourceListResponse<MessageWithReplies>> {
    return { resources: [] };
  }

  // Latest messages of user from all over workspace
  async inbox(): Promise<ResourceListResponse<MessageWithReplies>> {
    return { resources: [] };
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
    const limit = +request.query.limit || 100;

    async function* getNextMessages(service: MessageServiceAPI): AsyncIterableIterator<Message> {
      let lastPageToken = null;
      let messages: Message[] = [];
      let hasMoreMessages = true;
      do {
        messages = await service.views
          .search(
            new Pagination(lastPageToken, limit.toString()),
            {
              search: request.query.q,
              workspaceId: request.query.workspace_id,
              channelId: request.query.channel_id,
              companyId: request.params.company_id,
              ...(request.query.has_files ? { hasFiles: true } : {}),
              ...(request.query.sender ? { sender: request.query.sender } : {}),
            },
            context,
          )
          .then((a: ListResult<Message>) => {
            lastPageToken = a.nextPage.page_token;
            if (!lastPageToken) {
              hasMoreMessages = false;
            }
            return a.getEntities();
          });

        if (messages.length) {
          for (const message of messages) {
            yield message;
          }
        } else {
          hasMoreMessages = false;
        }
      } while (hasMoreMessages);
    }

    const messages = [] as Message[];

    for await (const msg of getNextMessages(this.service)) {
      const isChannelMember = await this.channelService.members.isChannelMember(
        { id: request.currentUser.id },
        {
          company_id: msg.cache.company_id,
          workspace_id: msg.cache.workspace_id,
          id: msg.cache.channel_id,
        },
        50,
      );
      if (!isChannelMember) continue;

      messages.push(msg);
      if (messages.length == limit) {
        break;
      }
    }

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
  filter?: "pinned" | "files" | "thread";
}

export interface MessageViewSearchQueryParameters extends PaginationQueryParameters {
  q: string;
  workspace_id: string;
  channel_id: string;
  sender: string;
  has_files: boolean;
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

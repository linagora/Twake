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
import WorkspaceServicesAPI from "../../../workspaces/api";
import { WorkspaceExecutionContext } from "../../../channels/types";
import { uniq } from "lodash";

class SimpleChannelsCache {
  private readonly data: { [key: string]: { [key: string]: boolean } };
  private readonly expiration: { [key: string]: number };
  static now = () => new Date().getTime();

  constructor(protected minutesTTL: number) {
    this.data = {};
    this.expiration = {};
    setInterval(() => {
      const now = SimpleChannelsCache.now();
      Object.keys(this.expiration).forEach(key => {
        if (now > this.expiration[key]) {
          delete this.expiration[key];
          delete this.data[key];
        }
      });
    }, minutesTTL * 1000);
  }

  async get(key: string, setIfMissing: () => Promise<{ [key: string]: boolean }> = undefined) {
    const exp = this.expiration[key];
    if (!exp || SimpleChannelsCache.now() > exp) {
      if (!setIfMissing) {
        return null;
      }
      this.set(key, await setIfMissing());
    }
    return this.data[key];
  }

  set(key: string, value: { [key: string]: boolean }) {
    this.expiration[key] = SimpleChannelsCache.now() + this.minutesTTL * 1000;
    this.data[key] = value;
  }
}

const simpleChannelsCache = new SimpleChannelsCache(5);

export class ViewsController {
  constructor(
    protected realtime: RealtimeServiceAPI,
    protected service: MessageServiceAPI,
    protected workspaceService: WorkspaceServicesAPI,
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

  private async getUserChannels(
    userId: string,
    companyId: string,
  ): Promise<{ [key: string]: boolean }> {
    const userWorkspaces = await this.workspaceService.workspaces.getAllIdsForUser(
      userId,
      companyId,
    );
    const userChannels = {} as { [key: string]: boolean };
    await Promise.all(
      userWorkspaces.map(ws =>
        this.channelService.members.listAllUserChannelsIds(userId, companyId, ws).then(items =>
          items.forEach(id => {
            userChannels[id] = true;
          }),
        ),
      ),
    );
    return userChannels;
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

    const companyId = request.params.company_id;

    const userChannels = await simpleChannelsCache.get(request.currentUser.id, async () =>
      this.getUserChannels(request.currentUser.id, companyId),
    );

    async function* getNextMessages(service: MessageServiceAPI) {
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
          yield messages;
        } else {
          hasMoreMessages = false;
        }
      } while (hasMoreMessages);
    }

    let messages = [] as Message[];

    for await (let m of getNextMessages(this.service)) {
      m = m.filter(msg => {
        return !(
          !userChannels[msg.cache.channel_id] ||
          (request.query.sender && msg.user_id != request.query.sender) ||
          (request.query.has_files && !(msg.files || []).length)
        );
      });

      m.forEach(msg => {
        messages.push(msg);
      });
      if (messages.length >= limit) {
        break;
      }
    }

    messages = messages.slice(0, limit);

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

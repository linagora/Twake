import { FastifyReply, FastifyRequest } from "fastify";
import { ResourceListResponse } from "../../../../utils/types";
import { Message } from "../../entities/messages";
import { handleError } from "../../../../utils/handleError";
import {
  CrudException,
  ListResult,
  Pagination,
} from "../../../../core/platform/framework/api/crud-service";
import {
  ChannelViewExecutionContext,
  FlatFileFromMessage,
  FlatPinnedFromMessage,
  MessageViewListOptions,
  MessageWithReplies,
  PaginationQueryParameters,
} from "../../types";
import { keyBy } from "lodash";
import gr from "../../../global-resolver";
import { CompanyExecutionContext } from "../../../applications/web/types";
import { PublicFile } from "../../../files/entities/file";

export class ViewsController {
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
  ): Promise<
    ResourceListResponse<MessageWithReplies | FlatFileFromMessage | FlatPinnedFromMessage>
  > {
    const pagination = new Pagination(
      request.query.page_token,
      request.query.limit,
      request.query.direction !== "history",
    );
    const query = { ...request.query, include_users: request.query.include_users };
    const context = getChannelViewExecutionContext(request);

    let resources: ListResult<MessageWithReplies | FlatFileFromMessage | FlatPinnedFromMessage>;

    try {
      if (request.query.filter === "files") {
        resources = await gr.services.messages.views.listChannelFiles(pagination, query, context);
      } else if (request.query.filter === "thread") {
        resources = await gr.services.messages.views.listChannelThreads(pagination, query, context);
      } else if (request.query.filter === "pinned") {
        resources = await gr.services.messages.views.listChannelPinned(pagination, query, context);
      } else {
        resources = await gr.services.messages.views.listChannel(pagination, query, context);
      }

      if (!resources) {
        throw new Error("No list resources created");
      }

      let entities = [];
      if (request.query.include_users) {
        for (const msg of resources.getEntities()) {
          if (request.query.flat) {
            entities.push({
              ...msg,
              ...((msg as any).message
                ? {
                    message: await gr.services.messages.messages.includeUsersInMessageWithReplies(
                      (msg as any).message,
                    ),
                  }
                : {}),
              ...((msg as any).thread
                ? {
                    thread: await gr.services.messages.messages.includeUsersInMessageWithReplies(
                      (msg as any).thread,
                    ),
                  }
                : {}),
            } as FlatFileFromMessage | FlatPinnedFromMessage);
          } else {
            entities.push(
              await gr.services.messages.messages.includeUsersInMessageWithReplies(
                msg as MessageWithReplies,
              ),
            );
          }
        }
      } else {
        entities = resources.getEntities();
      }

      return {
        resources: entities,
        ...(request.query.websockets && {
          websockets: gr.platformServices.realtime.sign(
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
  async files(
    request: FastifyRequest<{
      Params: { company_id: string };
      Querystring: { page_token: null; limit: 100; type: "user_upload" | "user_download" };
    }>,
  ): Promise<ResourceListResponse<PublicFile>> {
    if (request.query.type !== "user_upload") {
      throw CrudException.notImplemented(`Not implemented for type ${request.query.type}`);
    }

    const userFiles = await gr.services.files.listUserUploadedFiles(
      request.currentUser.id,
      getCompanyExecutionContext(request),
      new Pagination(request.query.page_token, String(request.query.limit)),
    );

    return {
      resources: userFiles
        .getEntities()
        .filter(a => a)
        .map(a => a.getPublicObject()),
      next_page_token: userFiles.nextPage.page_token,
    };
  }

  // Latest messages of user from all over workspace
  async inbox(
    request: FastifyRequest<{
      Querystring: MessageViewListQueryParameters;
      Params: {
        company_id: string;
      };
    }>,
    reply: FastifyReply,
  ): Promise<ResourceListResponse<Message>> {
    const context = getCompanyExecutionContext(request);
    const messages = await gr.services.messages.messages.inbox(
      request.currentUser.id,
      context,
      new Pagination(null, String(request.query.limit)),
    );

    return {
      resources: messages.getEntities(),
    };
  }

  async search(
    request: FastifyRequest<{
      Querystring: MessageViewSearchQueryParameters;
      Params: {
        company_id: string;
      };
    }>,
    context: ChannelViewExecutionContext,
  ): Promise<ResourceListResponse<Message>> {
    if (request.query.q.length < 2) {
      return { resources: [] };
    }

    const limit = +request.query.limit || 100;

    async function* getNextMessages(): AsyncIterableIterator<Message> {
      let lastPageToken = null;
      let messages: Message[] = [];
      let hasMoreMessages = true;
      do {
        messages = await gr.services.messages.views
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

    for await (const msg of getNextMessages()) {
      const isChannelMember = await gr.services.channels.members.isChannelMember(
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

    return { resources: messages };
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

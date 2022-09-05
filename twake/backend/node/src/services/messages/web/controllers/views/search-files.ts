import { FastifyRequest } from "fastify";
import { ListResult, Pagination } from "../../../../../core/platform/framework/api/crud-service";
import { MessageFile } from "../../../../../services/messages/entities/message-files";
import { Message } from "../../../../../services/messages/entities/messages";
import {
  ChannelViewExecutionContext,
  FlatFileFromMessage,
} from "../../../../../services/messages/types";
import { UserObject } from "../../../../../services/user/web/types";
import { PaginationQueryParameters, ResourceListResponse } from "../../../../../utils/types";
import { formatUser } from "../../../../../utils/users";
import gr from "../../../../global-resolver";
import { MessageFileRef } from "../../../../../services/messages/entities/message-file-refs";
import recentFiles from "./recent-files";
import { isEmpty } from "lodash";

interface MessageViewSearchFilesQueryParameters extends PaginationQueryParameters {
  q: string;
  workspace_id: string;
  channel_id: string;
  sender: string;
  is_file: boolean;
  is_media: boolean;
  extension: string;
}

export type FileSearchResult = MessageFile & {
  message: Message;
  user: UserObject;
  context?: MessageFileRef;
};

export default async (
  request: FastifyRequest<{
    Querystring: MessageViewSearchFilesQueryParameters & {
      page_token: string;
    };
    Params: {
      company_id: string;
    };
  }>,
  context: ChannelViewExecutionContext,
): Promise<ResourceListResponse<MessageFile>> => {
  const files = await searchFiles(request, context);

  //Include channel in reply everytime
  await Promise.all(
    files.resources.map((f, i) => {
      return (async () => {
        const channel = await gr.services.channels.channels.get(
          {
            id: f.cache.channel_id,
            company_id: f.cache.company_id,
            workspace_id: f.cache.workspace_id,
          },
          context,
        );
        files.resources[i] = { ...f, channel } as MessageFile;
      })();
    }),
  );

  return files;
};

const searchFiles = async (
  request: FastifyRequest<{
    Querystring: MessageViewSearchFilesQueryParameters & {
      page_token: string;
    };
    Params: {
      company_id: string;
    };
  }>,
  context: ChannelViewExecutionContext,
): Promise<ResourceListResponse<MessageFile>> => {
  const limit = +request.query.limit || 100;

  if (isEmpty(request.query?.q)) {
    if (request.query.channel_id) {
      const tmp = await gr.services.messages.views.listChannelFiles(
        new Pagination(request.query.page_token, limit.toString()),
        {
          flat: true,
          ...(request.query.is_file ? { file_only: true } : {}),
          ...(request.query.is_media ? { media_only: true } : {}),
        },
        {
          ...context,
          channel: {
            id: request.query.channel_id,
            workspace_id: request.query.workspace_id || context.channel.workspace_id,
            company_id: request.params.company_id,
          },
        },
      );

      let resources: FileSearchResult[] = [];
      for (let flatFile of tmp.getEntities()) {
        flatFile = flatFile as FlatFileFromMessage;
        resources.push({
          ...flatFile.file,
          message: flatFile.thread,
          context: flatFile.context,
          user: await formatUser(
            await gr.services.users.getCached({ id: flatFile.thread.user_id }),
          ),
        });
      }

      return {
        resources,
        next_page_token: tmp.nextPage.page_token,
      };
    } else {
      return recentFiles({
        ...request,
        query: {
          ...request.query,
          media: request.query.is_media
            ? "media_only"
            : request.query.is_file
            ? "file_only"
            : undefined,
        },
      });
    }
  }

  async function* getNextMessageFiles(initialPageToken?: string): AsyncIterableIterator<{
    msgFile: MessageFile;
    pageToken: string;
  }> {
    let lastPageToken = initialPageToken;
    let messageFiles: MessageFile[] = [];
    let hasMoreMessageFiles = true;
    do {
      messageFiles = await gr.services.messages.views
        .searchFiles(
          new Pagination(lastPageToken, limit.toString()),
          {
            search: request.query.q,
            companyId: request.params.company_id,
            workspaceId: request.query.workspace_id,
            channelId: request.query.channel_id,
            ...(request.query.is_file ? { isFile: true } : {}),
            ...(request.query.is_media ? { isMedia: true } : {}),
            ...(request.query.sender ? { sender: request.query.sender } : {}),
            ...(request.query.extension ? { extension: request.query.extension } : {}),
          },
          context,
        )
        .then((a: ListResult<MessageFile>) => {
          lastPageToken = a.nextPage.page_token;
          if (!lastPageToken) {
            hasMoreMessageFiles = false;
          }
          return a.getEntities();
        });

      if (messageFiles.length) {
        for (const messageFile of messageFiles) {
          yield { msgFile: messageFile, pageToken: lastPageToken };
        }
      } else {
        hasMoreMessageFiles = false;
      }
    } while (hasMoreMessageFiles);
  }

  let messageFiles = [] as FileSearchResult[];
  let nextPageToken = null;

  for await (const { msgFile, pageToken } of getNextMessageFiles(request.query.page_token)) {
    nextPageToken = pageToken;
    const getChannelMember = await gr.services.channels.members.getChannelMember(
      { id: request.currentUser.id },
      {
        company_id: msgFile.cache?.company_id,
        workspace_id: msgFile.cache?.workspace_id,
        id: msgFile.cache?.channel_id,
      },
      50,
      context,
    );
    if (!getChannelMember) continue;

    try {
      const message = await gr.services.messages.messages.get({
        thread_id: msgFile.thread_id,
        id: msgFile.message_id,
      });
      const user = await formatUser(
        await gr.services.users.getCached({ id: msgFile.cache?.user_id }),
      );

      messageFiles.push({ ...msgFile, user, message });
      if (messageFiles.length == limit) {
        break;
      }
    } catch (e) {
      continue;
    }
  }

  messageFiles = messageFiles
    .filter(mf => mf.message.subtype !== "deleted")
    .filter(a => a?.metadata?.external_id);

  return {
    resources: messageFiles,
    ...(nextPageToken && {
      next_page_token: nextPageToken,
    }),
  };
};

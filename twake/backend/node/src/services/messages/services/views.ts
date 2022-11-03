import _, { uniqBy } from "lodash";
import {
  Initializable,
  TwakeContext,
  TwakeServiceProvider,
} from "../../../core/platform/framework";
import {
  ExecutionContext,
  ListResult,
  Paginable,
  Pagination,
} from "../../../core/platform/framework/api/crud-service";
import Repository from "../../../core/platform/services/database/services/orm/repository/repository";
import SearchRepository from "../../../core/platform/services/search/repository";
import { fileIsMedia } from "../../../services/files/utils";
import { formatUser } from "../../../utils/users";
import gr from "../../global-resolver";
import { MessageChannelMarkedRef } from "../entities/message-channel-marked-refs";
import { MessageChannelRef } from "../entities/message-channel-refs";
import { MessageFileRef } from "../entities/message-file-refs";
import { MessageFile } from "../entities/message-files";
import { Message } from "../entities/messages";
import { Thread } from "../entities/threads";
import {
  ChannelViewExecutionContext,
  CompanyExecutionContext,
  FlatFileFromMessage,
  FlatPinnedFromMessage,
  MessageViewListOptions,
  MessageWithReplies,
  SearchMessageFilesOptions,
  SearchMessageOptions,
} from "../types";
import { FileSearchResult } from "../web/controllers/views/search-files";
import { buildMessageListPagination } from "./utils";

export class ViewsServiceImpl implements TwakeServiceProvider, Initializable {
  version: "1";
  repositoryChannelRefs: Repository<MessageChannelRef>;
  repositoryThreads: Repository<Thread>;
  repositoryFilesRef: Repository<MessageFileRef>;
  repositoryMessageFile: Repository<MessageFile>;
  repositoryMarkedRef: Repository<MessageChannelMarkedRef>;
  searchRepository: SearchRepository<Message>;
  searchFilesRepository: SearchRepository<MessageFile>;

  async init(context: TwakeContext): Promise<this> {
    this.searchRepository = gr.platformServices.search.getRepository<Message>("messages", Message);
    this.searchFilesRepository = gr.platformServices.search.getRepository<MessageFile>(
      "message_files",
      MessageFile,
    );
    this.repositoryThreads = await gr.database.getRepository<Thread>("threads", Thread);
    this.repositoryChannelRefs = await gr.database.getRepository<MessageChannelRef>(
      "message_channel_refs",
      MessageChannelRef,
    );
    this.repositoryFilesRef = await gr.database.getRepository<MessageFileRef>(
      "message_file_refs",
      MessageFileRef,
    );
    this.repositoryMarkedRef = await gr.database.getRepository<MessageChannelMarkedRef>(
      "message_channel_marked_refs",
      MessageChannelMarkedRef,
    );
    this.repositoryMessageFile = await gr.database.getRepository<MessageFile>(
      "message_files",
      MessageFile,
    );

    return this;
  }

  async listChannelFiles(
    pagination: Pagination,
    options?: MessageViewListOptions,
    context?: ChannelViewExecutionContext,
  ): Promise<ListResult<MessageWithReplies | FlatFileFromMessage>> {
    const refs = await this.repositoryFilesRef.find(
      {
        target_type: options?.media_only
          ? "channel_media"
          : options?.file_only
          ? "channel_file"
          : "channel",
        target_id: context.channel.id,
        company_id: context.channel.company_id,
      },
      buildMessageListPagination(pagination, "id"),
    );

    const threads: (MessageWithReplies & { context: MessageFileRef })[] = [];
    for (const ref of refs.getEntities()) {
      const thread = await this.repositoryThreads.findOne({ id: ref.thread_id }, {});
      const extendedThread = await gr.services.messages.messages.getThread(
        thread,
        {
          replies_per_thread: options.replies_per_thread || 1,
        },
        context,
      );

      const message = await gr.services.messages.messages.get({
        thread_id: ref.thread_id,
        id: ref.message_id,
      });
      if (message && extendedThread) {
        extendedThread.highlighted_replies = [message];
        threads.push({ ...extendedThread, context: ref });
      }
    }

    if (options.flat) {
      let files: FlatFileFromMessage[] = [];
      for (const thread of threads) {
        for (const reply of thread.highlighted_replies) {
          for (const file of reply.files || []) {
            if (file.id === thread.context.message_file_id) {
              files.push({
                file: file as MessageFile,
                thread,
                context: thread.context,
              });
            }
          }
        }
      }
      files = _.uniqBy(files, f => f.file.id);
      refs.nextPage.page_token = files.length > 0 ? files[files.length - 1].context?.id : null;
      return new ListResult("file", files, refs.nextPage);
    }

    return new ListResult("thread", threads, refs.nextPage);
  }

  async listChannelPinned(
    pagination: Pagination,
    options?: MessageViewListOptions,
    context?: ChannelViewExecutionContext,
  ): Promise<ListResult<MessageWithReplies | FlatPinnedFromMessage>> {
    const refs = await this.repositoryMarkedRef.find(
      {
        company_id: context.channel.company_id,
        workspace_id: context.channel.workspace_id,
        type: "pinned",
        channel_id: context.channel.id,
      },
      buildMessageListPagination(pagination, "thread_id"),
      context,
    );

    const threads: MessageWithReplies[] = [];
    for (const ref of uniqBy(refs.getEntities(), "thread_id")) {
      const thread = await this.repositoryThreads.findOne({ id: ref.thread_id }, {});
      const extendedThread = await gr.services.messages.messages.getThread(
        thread,
        {
          replies_per_thread: options.replies_per_thread || 1,
        },
        context,
      );
      if (extendedThread) {
        threads.push(extendedThread);
      }
    }

    for (const ref of refs.getEntities()) {
      const extendedThread = threads.find(th => th.id === ref.thread_id);
      if (extendedThread) {
        extendedThread.highlighted_replies = extendedThread.highlighted_replies || [];
        const message = await gr.services.messages.messages.get({
          thread_id: ref.thread_id,
          id: ref.message_id,
        });
        extendedThread.highlighted_replies.push(message);
      }
    }

    if (options.flat) {
      const messages: FlatPinnedFromMessage[] = [];
      for (const thread of threads) {
        for (const message of thread.highlighted_replies) {
          messages.push({
            message,
            thread,
          });
        }
      }
      return new ListResult("message", messages, refs.nextPage);
    }

    return new ListResult("thread", threads, null);
  }

  async listChannelThreads(
    pagination: Pagination,
    options?: MessageViewListOptions,
    context?: ChannelViewExecutionContext,
  ): Promise<ListResult<MessageWithReplies>> {
    return this.listChannel(pagination, { ...options, replies_per_thread: 0 }, context);
  }

  /**
   * Get last threads in a channel.
   *
   * We can do great improvements in the number of calls we currently do:
    - Get last threads refs (1req)
    - For each ref get the corresponding thread (to get number of replies => can be cached in the thread ref itself) (threads x reqs)
    - For each thread, get first message (=> first message id can be cached in thread ref too and so replace this request by a $in) (threads x reqs)
    - For each thread get last N replies (threads x reqs)

    Total requests for "get last 20 threads with their last 3 replies":
    + 1
    + 20 (can be cached in first req)
    + 20 (can be replaced by a $in )
    + 20
    ----
    = 61 reqs
   * @param pagination
   * @param options
   * @param context
   * @returns
   */
  async listChannel(
    pagination: Paginable,
    options?: MessageViewListOptions,
    context?: ChannelViewExecutionContext,
  ): Promise<ListResult<MessageWithReplies>> {
    const threadsRefs = await this.repositoryChannelRefs.find(
      {
        company_id: context.channel.company_id,
        workspace_id: context.channel.workspace_id,
        channel_id: context.channel.id,
      },
      buildMessageListPagination(Pagination.fromPaginable(pagination), "message_id"),
      context,
    );

    const threads = uniqBy(
      (
        await this.repositoryThreads.find(
          {},
          {
            $in: [["id", threadsRefs.getEntities().map(ref => ref.thread_id)]],
          },
          context,
        )
      ).getEntities(),
      thread => thread.id,
    );

    //Get first message for each thread and add last replies for each thread
    let threadWithLastMessages: MessageWithReplies[] = [];
    if (options.replies_per_thread !== 0) {
      await Promise.all(
        threads.map(async (thread: Thread) => {
          const extendedThread = await gr.services.messages.messages.getThread(
            thread,
            {
              replies_per_thread: options.replies_per_thread || 3,
            },
            context,
          );

          if (
            extendedThread?.last_replies?.length === 0 &&
            extendedThread.created_at > new Date().getTime() - 1000 * 60 //This is important to avoid removing thread if people loads a channel at the same time people create a thread
          ) {
            await gr.services.messages.threads.delete(
              { id: extendedThread.thread_id },
              { user: { id: null, server_request: true } },
            );
          } else if (extendedThread) {
            threadWithLastMessages.push(extendedThread);
          }
        }),
      );
    }
    threadWithLastMessages = threadWithLastMessages
      .filter(m => m.id)
      .sort((a, b) => a.stats.last_activity - b.stats.last_activity);

    return new ListResult("thread", threadWithLastMessages, threadsRefs.nextPage);
  }

  async search(
    pagination: Pagination,
    options: SearchMessageOptions,
    context?: ExecutionContext,
  ): Promise<ListResult<Message>> {
    return await this.searchRepository
      .search(
        {
          ...(options.hasFiles ? { has_files: true } : {}),
          ...(options.hasMedias ? { has_medias: true } : {}),
        },
        {
          pagination,
          ...(options.companyId ? { $in: [["company_id", [options.companyId]]] } : {}),
          ...(options.workspaceId ? { $in: [["workspace_id", [options.workspaceId]]] } : {}),
          ...(options.channelId ? { $in: [["channel_id", [options.channelId]]] } : {}),
          ...(options.sender ? { $in: [["user_id", [options.sender]]] } : {}),
          $text: {
            $search: options.search,
          },
          $sort: {
            created_at: "desc",
          },
        },
        context,
      )
      .then(a => {
        return a;
      });
  }

  async searchFiles(
    pagination: Pagination,
    options: SearchMessageFilesOptions,
    context?: ExecutionContext,
  ): Promise<ListResult<MessageFile>> {
    const temp = await this.searchFilesRepository.search(
      {
        ...(options.isFile ? { is_file: true } : {}),
        ...(options.isMedia ? { is_media: true } : {}),
      },
      {
        pagination,
        ...(options.companyId ? { $in: [["cache_company_id", [options.companyId]]] } : {}),
        ...(options.workspaceId ? { $in: [["cache_workspace_id", [options.workspaceId]]] } : {}),
        ...(options.channelId ? { $in: [["cache_channel_id", [options.channelId]]] } : {}),
        ...(options.sender ? { $in: [["cache_user_id", [options.sender]]] } : {}),
        ...(options.extension ? { $in: [["extension", [options.extension]]] } : {}),
        $text: {
          $search: options.search,
        },
        $sort: {
          created_at: "desc",
        },
      },
      context,
    );

    return new ListResult(temp.type, await this.checkFiles(temp.getEntities()), temp.nextPage);
  }

  async listUserMarkedFiles(
    userId: string,
    type: "user_upload" | "user_download" | "both",
    media: "file_only" | "media_only" | "both",
    context: CompanyExecutionContext,
    pagination: Pagination,
  ): Promise<ListResult<FileSearchResult>> {
    let files: (MessageFile & { context: MessageFileRef })[] = [];
    let nextPageUploads: Paginable;
    let nextPageDownloads: Paginable;
    do {
      const uploads =
        type === "user_upload" || type === "both"
          ? await this.repositoryFilesRef
              .find(
                { target_type: "user_upload", target_id: userId, company_id: context.company.id },
                {
                  pagination: { ...pagination, page_token: nextPageUploads?.page_token },
                },
                context,
              )
              .then(a => {
                nextPageUploads = a.nextPage;
                return a.getEntities();
              })
          : [];

      const downloads =
        type === "user_download" || type === "both"
          ? await this.repositoryFilesRef
              .find(
                { target_type: "user_download", target_id: userId, company_id: context.company.id },
                {
                  pagination: { ...pagination, page_token: nextPageDownloads?.page_token },
                },
                context,
              )
              .then(a => {
                nextPageDownloads = a.nextPage;
                return a.getEntities();
              })
          : [];

      const refs = [...uploads, ...downloads];

      const messageFilePromises: Promise<MessageFile & { context: MessageFileRef }>[] = refs.map(
        async ref => {
          try {
            const res = {
              ...(await this.repositoryMessageFile.findOne(
                {
                  message_id: ref.message_id,
                  id: ref.message_file_id,
                },
                {},
                context,
              )),
              context: ref,
            };

            return res;
          } catch (e) {
            return null;
          }
        },
      );

      const messageFiles = _.uniqBy(
        (await Promise.all(messageFilePromises)).filter(a => a),
        a => a.metadata?.source + JSON.stringify(a.metadata?.external_id),
      );

      files = [...files, ...messageFiles.filter(a => a)].filter(ref => {
        //Apply media filer
        const isMedia = fileIsMedia(ref);
        return !((media === "file_only" && isMedia) || (media === "media_only" && !isMedia));
      });
      files = files.sort((a, b) => b.created_at - a.created_at);
    } while (
      files.length < (parseInt(pagination.limitStr) || 100) &&
      (nextPageDownloads?.page_token || nextPageUploads?.page_token)
    );

    const fileWithUserAndMessagePromise: Promise<FileSearchResult>[] = files.map(
      async file =>
        ({
          user: await formatUser(await gr.services.users.getCached({ id: file.cache?.user_id })),
          message: await gr.services.messages.messages.get({
            id: file.message_id,
            thread_id: file.thread_id,
          }),
          ...file,
        } as FileSearchResult),
    );
    const fileWithUserAndMessage = await Promise.all(fileWithUserAndMessagePromise);

    return new ListResult<FileSearchResult>(
      "file",
      await this.checkFiles(fileWithUserAndMessage),
      nextPageUploads || nextPageDownloads,
    );
  }

  async checkFiles<T extends MessageFile>(files: T[]): Promise<T[]> {
    const results = await Promise.all(
      files.map(async file => {
        if (file.metadata.source !== "internal") return true;
        const ei = file.metadata.external_id;
        return await gr.services.files.exists(ei.id, ei.company_id);
      }),
    );
    return files.filter((_v, index) => results[index]);
  }
}

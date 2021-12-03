import {
  ExecutionContext,
  ListResult,
  Pagination,
} from "../../../../core/platform/framework/api/crud-service";
import { TwakeContext } from "../../../../core/platform/framework";
import Repository from "../../../../core/platform/services/database/services/orm/repository/repository";
import { MessageServiceAPI, MessageViewsServiceAPI } from "../../api";
import { Message } from "../../entities/messages";
import { Thread } from "../../entities/threads";
import {
  ChannelViewExecutionContext,
  MessageViewListOptions,
  MessageWithReplies,
} from "../../types";
import { MessageChannelRef } from "../../entities/message-channel-refs";
import { buildMessageListPagination } from "../utils";
import { uniqBy, isEqual, uniqWith } from "lodash";
import { SearchUserOptions } from "../../../user/services/users/types";
import { PlatformServicesAPI } from "../../../../core/platform/services/platform-services";
import SearchRepository from "../../../../core/platform/services/search/repository";
import { uuid } from "../../../../utils/types";

export class ViewsService implements MessageViewsServiceAPI {
  version: "1";
  repositoryChannelRefs: Repository<MessageChannelRef>;
  repository: Repository<Message>;
  repositoryThreads: Repository<Thread>;
  searchRepository: SearchRepository<Message>;

  constructor(private platformServices: PlatformServicesAPI, private service: MessageServiceAPI) {}

  async init(context: TwakeContext): Promise<this> {
    this.searchRepository = this.platformServices.search.getRepository<Message>(
      "messages",
      Message,
    );
    this.repository = await this.platformServices.database.getRepository<Message>(
      "messages",
      Message,
    );
    this.repositoryThreads = await this.platformServices.database.getRepository<Thread>(
      "threads",
      Thread,
    );
    this.repositoryChannelRefs =
      await this.platformServices.database.getRepository<MessageChannelRef>(
        "message_channel_refs",
        MessageChannelRef,
      );

    return this;
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
    pagination: Pagination,
    options?: MessageViewListOptions,
    context?: ChannelViewExecutionContext,
  ): Promise<ListResult<MessageWithReplies>> {
    const threadsRefs = await this.repositoryChannelRefs.find(
      {
        company_id: context.channel.company_id,
        workspace_id: context.channel.workspace_id,
        channel_id: context.channel.id,
      },
      buildMessageListPagination(pagination, "message_id"),
    );

    const threads = uniqBy(
      (
        await this.repositoryThreads.find(
          {},
          {
            $in: [["id", threadsRefs.getEntities().map(ref => ref.thread_id)]],
          },
        )
      ).getEntities(),
      thread => thread.id,
    );

    //Get first message for each thread and add last replies for each thread
    let threadWithLastMessages: MessageWithReplies[] = [];
    await Promise.all(
      threads.map(async (thread: Thread) => {
        const extendedThread = await this.service.messages.getThread(thread, {
          replies_per_thread: options.replies_per_thread || 3,
        });

        if (
          extendedThread?.last_replies?.length === 0 &&
          extendedThread.created_at > new Date().getTime() - 1000 * 60 //This is important to avoid removing thread if people loads a channel at the same time people create a thread
        ) {
          await this.service.threads.delete(
            { id: extendedThread.thread_id },
            { user: { id: null, server_request: true } },
          );
        } else if (extendedThread) {
          threadWithLastMessages.push(extendedThread);
        }
      }),
    );
    threadWithLastMessages = threadWithLastMessages
      .filter(m => m.id)
      .sort((a, b) => a.stats.last_activity - b.stats.last_activity);

    return new ListResult("thread", threadWithLastMessages, threadsRefs.nextPage);
  }

  async search(
    pagination: Pagination,
    options?: SearchUserOptions,
    context?: ExecutionContext,
  ): Promise<ListResult<Message>> {
    return await this.searchRepository.search(
      {},
      {
        pagination,
        ...(options.companyId ? { $in: [["company_id", [options.companyId]]] } : {}),
        ...(options.workspaceId ? { $in: [["workspace_id", [options.workspaceId]]] } : {}),
        $text: {
          $search: options.search,
        },
      },
    );
  }

  async getThreadsFirstMessages(threadsIds: uuid[]): Promise<Message[]> {
    threadsIds = uniqWith(threadsIds, isEqual);
    const items = threadsIds.map(threadId =>
      this.repository
        .find({ thread_id: threadId }, { pagination: new Pagination("", "1", true) })
        .then(a => a.getEntities()[0]),
    );
    return Promise.all(items);
  }
}

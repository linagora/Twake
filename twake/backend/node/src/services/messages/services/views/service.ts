import { ListResult, Pagination } from "../../../../core/platform/framework/api/crud-service";
import { TwakeContext } from "../../../../core/platform/framework";
import { DatabaseServiceAPI } from "../../../../core/platform/services/database/api";
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
import _, { extend } from "lodash";
import { option } from "yargs";

export class ViewsService implements MessageViewsServiceAPI {
  version: "1";
  repositoryChannelRefs: Repository<MessageChannelRef>;
  repository: Repository<Message>;
  repositoryThreads: Repository<Thread>;

  constructor(private database: DatabaseServiceAPI, private service: MessageServiceAPI) {}

  async init(context: TwakeContext): Promise<this> {
    this.repository = await this.database.getRepository<Message>("messages", Message);
    this.repositoryThreads = await this.database.getRepository<Thread>("threads", Thread);
    this.repositoryChannelRefs = await this.database.getRepository<MessageChannelRef>(
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

    const threads = _.uniqBy(
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

        if (extendedThread?.last_replies?.length === 0) {
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
}

import {
  DeleteResult,
  ExecutionContext,
  ListResult,
  OperationType,
  SaveResult,
} from "../../../core/platform/framework/api/crud-service";
import { Initializable, logger, TwakeServiceProvider } from "../../../core/platform/framework";
import Repository from "../../../core/platform/services/database/services/orm/repository/repository";
import { ParticipantObject, Thread } from "../entities/threads";
import { CompanyExecutionContext, ThreadExecutionContext } from "../types";
import { Message } from "../entities/messages";
import _ from "lodash";
import { extendExecutionContentWithChannel } from "../web/controllers";
import gr from "../../global-resolver";

export class ThreadsService implements TwakeServiceProvider, Initializable {
  version: "1";
  name: "ThreadsService";
  repository: Repository<Thread>;

  async init(): Promise<this> {
    this.repository = await gr.database.getRepository<Thread>("threads", Thread);
    return this;
  }

  /**
   * Create a thread with its first message in it
   * @param item
   * @param options
   * @param context
   * @returns
   */
  async save(
    item: Pick<Thread, "id"> & {
      participants: Pick<ParticipantObject, "id" | "type">[];
    },
    options: { participants?: ParticipantOperation; message?: Message } = {},
    context?: CompanyExecutionContext,
  ): Promise<SaveResult<Thread>> {
    if (item.id) {
      //Update
      const participantsOperation: ParticipantOperation = options.participants || {
        add: [],
        remove: [],
      };

      const thread = await this.repository.findOne({ id: item.id }, {}, context);

      if (thread) {
        // Add the created_by information
        participantsOperation.add = (participantsOperation.add || []).map(p => {
          return {
            created_by: context.user.id,
            created_at: new Date().getTime(),
            ...p,
          };
        }) as ParticipantObject[];

        thread.participants = _.uniqBy(
          _.differenceBy(
            [...thread.participants, ...participantsOperation.add],
            participantsOperation.remove || [],
            p => p.id,
          ),
          p => p.id,
        ) as ParticipantObject[];

        await this.repository.save(thread, context);

        //TODO ensure the thread is in all participants views (and removed from deleted participants)

        return new SaveResult(
          "thread",
          await this.getWithMessage({ id: thread.id }),
          OperationType.UPDATE,
        );
      } else {
        //Thread to edit does not exists

        if (!context.user?.server_request) {
          throw new Error("ThreadService: Unable to edit inexistent thread");
        }
      }
    }

    //Creation of thread or server edition
    if (!options.message) {
      if (context.user?.server_request) {
        logger.info(`${this.name} - Create empty thread by server itself`);
      } else {
        throw new Error("You must provide an initial message in the thread.");
      }
    }

    //Enforce current user in the participants list and add the created_by information
    const participants: ParticipantObject[] = [
      context.user.application_id ? {} : { type: "user", id: context.user.id },
      ...item.participants,
    ].map(p => {
      return {
        created_by: context.user.id,
        created_at: new Date().getTime(),
        ...p,
      };
    }) as ParticipantObject[];

    const message: Message | null = options.message || null;

    const thread = new Thread();
    thread.created_at = new Date().getTime();
    thread.last_activity = thread.created_at;
    thread.answers = 0;
    thread.created_by = context.user.id;
    thread.participants = _.uniqBy(participants, p => p.id);

    //If server request, we allow more
    if (context.user?.server_request) {
      thread.id = item.id;
      thread.created_at = (item as Thread)?.created_at || thread.created_at;
    }

    if (message && message.ephemeral) {
      //We should not save if this is an ephemeral message
    } else {
      await this.repository.save(thread, context);
    }

    if (message) {
      message.status = "sent";

      const result = await gr.services.messages.messages.save(
        message,
        {
          threadInitialMessage: true,
        },
        extendExecutionContentWithChannel(
          participants,
          Object.assign(context, { thread: { id: thread.id, company_id: context.company.id } }),
        ),
      );
      try {
        const channelMembersCount = await gr.services.channels.members.getUsersCount({
          id: result.entity.cache.channel_id,
          company_id: result.entity.cache.company_id,
          workspace_id: result.entity.cache.workspace_id,
          counter_type: "members",
        });

        if (channelMembersCount === 1) {
          await gr.services.messages.messages.updateDeliveryStatus(
            {
              message_id: result.entity.id,
              self_message: true,
              status: "read",
              thread_id: result.entity.thread_id,
            },
            {
              ...context,
              thread: { id: thread.id },
            },
          );

          await gr.services.channels.members.setChannelMemberReadSections(
            {
              start: result.entity.id,
              end: result.entity.id,
            },
            {
              ...context,
              channel_id: result.entity.cache.channel_id,
              workspace_id: result.entity.cache.workspace_id,
            },
          );
        }
      } catch (err) {
        logger.error("failed to update message delivery status");
      }
    }

    return new SaveResult(
      "thread",
      await this.getWithMessage({ id: thread.id }),
      OperationType.CREATE,
    );
  }

  /**
   * Add reply to thread: increase last_activity time and number of answers
   * @param threadId
   * @param increment
   * @param context
   */
  async addReply(threadId: string, increment: number = 1, context: ThreadExecutionContext) {
    const thread = await this.repository.findOne({ id: threadId }, {}, context);
    if (thread) {
      thread.answers = Math.max(0, (thread.answers || 0) + increment);
      if (increment > 0) {
        thread.last_activity = new Date().getTime();
      }
      await this.repository.save(thread, context);
    } else {
      throw new Error("Try to add reply count to inexistent thread");
    }

    await gr.services.messages.messages.shareMessageInRealtime(
      {
        id: threadId,
        thread_id: threadId,
      },
      {},
      context,
    );
  }

  /**
   * Add reply to thread: increase last_activity time and number of answers
   * @param threadId
   */
  async setReplyCount(threadId: string, count: number, context: ExecutionContext) {
    const thread = await this.repository.findOne({ id: threadId }, {}, context);
    if (thread) {
      thread.answers = count;
      await this.repository.save(thread, context);
    } else {
      throw new Error("Try to add reply count to inexistent thread");
    }
  }

  /**
   * Check context is allowed to accesss a thread
   * @param context
   * @returns
   */
  async checkAccessToThread(context: ThreadExecutionContext): Promise<boolean> {
    if (context?.user?.server_request) {
      return true;
    }

    logger.info(
      `Check access to thread ${context.thread.id} in company ${context.company.id} for user ${context.user.id} and app ${context?.user?.application_id}`,
    );

    const thread = await this.repository.findOne(
      {
        id: context.thread.id,
      },
      {},
      context,
    );

    if (!thread) {
      logger.info("No such thread");
      return false;
    }

    //User is participant of the thread directly
    if (thread.participants.some(p => p.type === "user" && p.id === context.user.id)) {
      return true;
    }

    //Check user is in one of the participant channels
    //TODO: get the channel_member from channel micro_service

    return false;
  }

  get(pk: Pick<Thread, "id">, context: ExecutionContext): Promise<Thread> {
    return this.repository.findOne(pk, {}, context);
  }

  async getWithMessage(
    pk: Pick<Thread, "id">,
    context?: ExecutionContext,
  ): Promise<Thread & { message: Message }> {
    const thread = await this.get(pk, context);
    return {
      ...thread,
      message: await gr.services.messages.messages.get(
        { id: pk.id, thread_id: pk.id },
        context as ThreadExecutionContext,
      ),
    };
  }

  async delete(pk: Pick<Thread, "id">, context?: ExecutionContext): Promise<DeleteResult<Thread>> {
    const thread = await this.repository.findOne({ id: pk.id }, {}, context);
    if (context.user.server_request) {
      await this.repository.remove(thread, context);
    }
    return new DeleteResult("thread", thread, context.user.server_request && !!thread);
  }

  list(): Promise<ListResult<Thread>> {
    throw new Error("CRUD method not used.");
  }
}

type ParticipantOperation = {
  add: Pick<ParticipantObject, "id" | "type">[];
  remove: Pick<ParticipantObject, "id" | "type">[];
};

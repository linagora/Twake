import {
  CRUDService,
  DeleteResult,
  ExecutionContext,
  ListResult,
  OperationType,
  Paginable,
  SaveResult,
} from "../../../../core/platform/framework/api/crud-service";
import { logger, TwakeContext } from "../../../../core/platform/framework";
import { DatabaseServiceAPI } from "../../../../core/platform/services/database/api";
import Repository from "../../../../core/platform/services/database/services/orm/repository/repository";
import { MessageServiceAPI, MessageThreadsServiceAPI } from "../../api";
import { ParticipantObject, Thread, ThreadPrimaryKey } from "../../entities/threads";
import { CompanyExecutionContext, ThreadExecutionContext } from "../../types";
import { Message } from "../../entities/messages";
import _ from "lodash";
import { extendExecutionContentWithChannel } from "../../web/controllers";

export class ThreadsService
  implements MessageThreadsServiceAPI, CRUDService<Thread, ThreadPrimaryKey, ExecutionContext>
{
  version: "1";
  name: "ThreadsService";
  repository: Repository<Thread>;

  constructor(private database: DatabaseServiceAPI, private service: MessageServiceAPI) {}

  async init(context: TwakeContext): Promise<this> {
    this.repository = await this.database.getRepository<Thread>("threads", Thread);
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

      const thread = await this.repository.findOne({ id: item.id });

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

        await this.repository.save(thread);

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

    await this.repository.save(thread);

    if (message) {
      await this.service.messages.save(
        message,
        {
          threadInitialMessage: true,
        },
        extendExecutionContentWithChannel(
          participants,
          Object.assign(context, { thread: { id: thread.id, company_id: context.company.id } }),
        ),
      );
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
   */
  async addReply(threadId: string, increment: number = 1) {
    const thread = await this.repository.findOne({ id: threadId });
    if (thread) {
      thread.answers = Math.max(0, (thread.answers || 0) + increment);
      if (increment > 0) {
        thread.last_activity = new Date().getTime();
      }
      await this.repository.save(thread);
    } else {
      throw new Error("Try to add reply count to inexistent thread");
    }
  }

  /**
   * Add reply to thread: increase last_activity time and number of answers
   * @param threadId
   */
  async setReplyCount(threadId: string, count: number) {
    const thread = await this.repository.findOne({ id: threadId });
    if (thread) {
      thread.answers = count;
      await this.repository.save(thread);
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

    const thread = await this.repository.findOne({
      id: context.thread.id,
    });

    if (!thread) {
      logger.info("No such thread");
      return false;
    }

    //User is participant of the thread directly
    if (thread.participants.some(p => p.type === "user" && p.id === context.user.id)) {
      return true;
    }

    //Check user is in one of the participant channels
    for (const channel of thread.participants.filter(p => p.type === "channel")) {
      if (true) {
        //TODO get the channel_member from channel micro_service
        return true;
      }
    }

    return false;
  }

  get(pk: Pick<Thread, "id">, context?: ExecutionContext): Promise<Thread> {
    return this.repository.findOne(pk);
  }

  async getWithMessage(
    pk: Pick<Thread, "id">,
    context?: ExecutionContext,
  ): Promise<Thread & { message: Message }> {
    const thread = await this.get(pk);
    return {
      ...thread,
      message: await this.service.messages.get({ id: pk.id, thread_id: pk.id }, context),
    };
  }

  async delete(pk: Pick<Thread, "id">, context?: ExecutionContext): Promise<DeleteResult<Thread>> {
    const thread = await this.repository.findOne({ id: pk.id });
    if (context.user.server_request) {
      await this.repository.remove(thread);
    }
    return new DeleteResult("thread", thread, context.user.server_request && !!thread);
  }

  list<ListOptions>(
    pagination: Paginable,
    options?: ListOptions,
    context?: ExecutionContext,
  ): Promise<ListResult<Thread>> {
    throw new Error("CRUD method not used.");
  }
}

type ParticipantOperation = {
  add: Pick<ParticipantObject, "id" | "type">[];
  remove: Pick<ParticipantObject, "id" | "type">[];
};

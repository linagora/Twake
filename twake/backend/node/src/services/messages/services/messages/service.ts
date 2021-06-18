import {
  SaveResult,
  OperationType,
  DeleteResult,
  ListResult,
  Pagination,
} from "../../../../core/platform/framework/api/crud-service";
import { ResourcePath } from "../../../../core/platform/services/realtime/types";
import { logger, RealtimeSaved, TwakeContext } from "../../../../core/platform/framework";
import { DatabaseServiceAPI } from "../../../../core/platform/services/database/api";
import Repository from "../../../../core/platform/services/database/services/orm/repository/repository";
import { MessageServiceAPI, MessageThreadMessagesServiceAPI } from "../../api";
import { Message, TYPE as MessageTableName } from "../../entities/messages";
import {
  BookmarkOperation,
  MessageLocalEvent,
  MessagesGetThreadOptions,
  MessagesSaveOptions,
  PinOperation,
  ReactionOperation,
  ThreadExecutionContext,
} from "../../types";
import { getThreadMessagePath, getThreadMessageWebsocketRoom } from "../../web/realtime";
import { localEventBus } from "../../../../core/platform/framework/pubsub";
import { buildMessageListPagination } from "../utils";
import _ from "lodash";
import { ThreadMessagesOperationsService } from "./operations";
import { getDefaultMessageInstance } from "./utils";
import { Thread } from "../../entities/threads";

export class ThreadMessagesService implements MessageThreadMessagesServiceAPI {
  version: "1";
  repository: Repository<Message>;
  operations: ThreadMessagesOperationsService;

  constructor(private database: DatabaseServiceAPI, private service: MessageServiceAPI) {
    this.operations = new ThreadMessagesOperationsService(database, service, this);
  }

  async init(context: TwakeContext): Promise<this> {
    this.repository = await this.database.getRepository<Message>(MessageTableName, Message);
    await this.operations.init(context);
    return this;
  }

  /**
   * Save a message
   * The server / application / users can do different actions
   * @param item
   * @param options
   * @param context
   * @returns SaveResult<Message>
   */
  async save(
    item: Message,
    options?: MessagesSaveOptions,
    context?: ThreadExecutionContext,
  ): Promise<SaveResult<Message>> {
    const serverRequest = context?.user?.server_request;

    if (!serverRequest && !this.service.threads.checkAccessToThread(context)) {
      logger.error(`Unable to write in thread ${context.thread.id}`);
      throw Error("Can't write this message.");
    }

    let created = !item.id;

    let message = getDefaultMessageInstance(item, context);

    //We try to update an existing message
    if (!created) {
      const messageToUpdate = await this.repository.findOne({
        id: item.id,
        thread_id: context.thread.id,
      });

      //Test if we can update this message. Can edit only:
      // - Server itself
      // - Message owner
      // - Application owner
      // Deleted messages cannot be edited except by server itself
      if (
        !serverRequest &&
        (!messageToUpdate ||
          (context?.user?.application_id !== messageToUpdate.application_id &&
            context.user.id !== messageToUpdate.user_id) ||
          messageToUpdate.subtype === "deleted")
      ) {
        logger.error(`Unable to edit message in thread ${message.thread_id}`);
        throw Error("Can't edit this message.");
      }

      //Created with forced id (server only)
      if (!messageToUpdate && !options?.message_moved) {
        created = true;
      }

      if (serverRequest) {
        message = _.assign(messageToUpdate || message, message);
      } else {
        if (messageToUpdate) {
          messageToUpdate.edited = {
            edited_at: new Date().getTime(),
          };

          let updatedMessage = _.assign(
            messageToUpdate,
            _.pick(message, "text", "blocks", "files", "context"),
          );
          if (context?.user?.application_id) {
            updatedMessage = _.assign(updatedMessage, _.pick(message, "override"));
          }

          message = updatedMessage;
        }
      }
    }

    //Server request can edit more fields
    if (serverRequest) {
      message.created_at = item.created_at || message.created_at;
    }

    logger.info(`Saved message in thread ${message.thread_id}`);

    if (!message.ephemeral) {
      await this.repository.save(message);
    }

    this.onSaved(message, { created }, context);

    return new SaveResult<Message>(
      "message",
      message,
      item.id ? OperationType.UPDATE : OperationType.CREATE,
    );
  }

  /**
   * Move a message from a thread to another
   * @param item
   * @param options
   * @param context
   * @returns
   */
  async move(
    pk: Pick<Message, "id">,
    options: { previous_thread: string },
    context: ThreadExecutionContext,
  ): Promise<void> {
    //Fixme: check user has access to both threads

    logger.error(
      `Try to move message ${pk.id} from thread ${options.previous_thread} to thread ${context.thread.id}`,
    );

    if (options.previous_thread === context.thread.id) {
      return;
    }

    const messageInOldThread = await this.repository.findOne({
      thread_id: options.previous_thread,
      id: pk.id,
    });

    if (!messageInOldThread) {
      logger.error(`Unable to find message ${pk.id} in old thread ${context.thread.id}`);
      throw Error("Can't move this message.");
    }

    const messageInNewThread = _.cloneDeep(messageInOldThread);
    messageInNewThread.thread_id = context.thread.id;

    await this.save(
      messageInNewThread,
      {
        message_moved: true,
      },
      {
        user: { id: null, server_request: true },
        thread: context.thread,
        company: context.company,
      },
    );

    await this.repository.remove(messageInOldThread);

    logger.error(
      `Moved message ${pk.id} from thread ${options.previous_thread} to thread ${context.thread.id}`,
    );

    return;
  }

  async delete(pk: Message, context?: ThreadExecutionContext): Promise<DeleteResult<Message>> {
    if (!context?.user?.server_request && !this.service.threads.checkAccessToThread(context)) {
      logger.error(`Unable to write in thread ${context.thread.id}`);
      throw Error("Can't edit this message.");
    }

    const message = await this.repository.findOne({
      thread_id: context.thread.id,
      id: pk.id,
    });

    if (!message) {
      logger.error(`This message doesn't exists`);
      throw Error("Can't delete this message.");
    }

    if (
      !context?.user?.server_request &&
      message.user_id !== context.user.id &&
      message.application_id !== context?.user?.application_id
    ) {
      logger.error(`You have no right to delete this message`);
      throw Error("Can't delete this message.");
    }

    message.subtype = "deleted";
    message.blocks = [];
    message.reactions = [];
    message.text = "Deleted message";
    message.files = [];

    logger.info(`Deleted message ${pk.id} from thread ${message.thread_id}`);
    await this.repository.save(message);
    this.onSaved(message, { created: false }, context);

    //Server and application can definively remove a message
    if (context.user.server_request || context.user.application_id || message.application_id) {
      await this.repository.remove(message);
    }

    return new DeleteResult<Message>("message", message, true);
  }

  async get(
    pk: Pick<Message, "thread_id" | "id">,
    context?: ThreadExecutionContext,
  ): Promise<Message> {
    return this.repository.findOne(pk);
  }

  async getThread(thread: Thread, options: MessagesGetThreadOptions = {}) {
    const last_replies = (
      await this.repository.find(
        {
          thread_id: thread.id,
        },
        {
          pagination: new Pagination("", `${options?.replies_per_thread || 3}`, true),
        },
      )
    ).getEntities();

    if (last_replies.length === 0) {
      //Delete the thread because it is empty
      this.service.threads.delete(thread, { user: { id: null, server_request: true } });
      return null;
    }

    const first_message = await this.repository.findOne(
      {
        thread_id: thread.id,
      },
      {
        pagination: new Pagination("", `1`, false),
      },
    );

    return {
      ...first_message,
      stats: {
        replies: last_replies.length === 1 ? 1 : thread.answers, //This line ensure the thread can be deleted by user if there is no replies
        last_activity: thread.last_activity,
      },
      last_replies: last_replies.sort((a, b) => a.created_at - b.created_at),
    };
  }

  async list<ListOption>(
    pagination: Pagination,
    options?: ListOption,
    context?: ThreadExecutionContext,
  ): Promise<ListResult<Message>> {
    const list = await this.repository.find(
      { thread_id: context.thread.id },
      buildMessageListPagination(pagination, "id"),
    );
    return list;
  }

  @RealtimeSaved<Message>((message, context) => [
    {
      room: ResourcePath.get(getThreadMessageWebsocketRoom(context as ThreadExecutionContext)),
      path: getThreadMessagePath(context as ThreadExecutionContext) + "/" + message.id,
    },
  ])
  async onSaved(message: Message, options: { created: boolean }, context: ThreadExecutionContext) {
    if (options.created && !message.ephemeral) {
      await this.service.threads.addReply(message.thread_id);
    }

    localEventBus.publish<MessageLocalEvent>("message:saved", {
      resource: message,
      context: context,
      created: options.created,
    });

    return new SaveResult<Message>(
      "message",
      message,
      options.created ? OperationType.CREATE : OperationType.UPDATE,
    );
  }

  async pin(
    operation: PinOperation,
    options: {},
    context: ThreadExecutionContext,
  ): Promise<SaveResult<Message>> {
    return this.operations.pin(operation, options, context);
  }

  async reaction(
    operation: ReactionOperation,
    options: {},
    context: ThreadExecutionContext,
  ): Promise<SaveResult<Message>> {
    return this.operations.reaction(operation, options, context);
  }

  async bookmark(
    operation: BookmarkOperation,
    options: {},
    context: ThreadExecutionContext,
  ): Promise<SaveResult<Message>> {
    return this.operations.bookmark(operation, options, context);
  }
}

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
      if (!messageToUpdate) {
        created = true;
      }

      if (messageToUpdate) {
        messageToUpdate.edited = {
          edited_at: new Date().getTime(),
        };

        message = _.assign(messageToUpdate, _.pick(message, "text", "blocks", "files", "context"));
        if (context?.user?.application_id || serverRequest) {
          message = _.assign(message, _.pick(message, "override"));
        }
      } else if (serverRequest) {
        message.id = item.id;
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

    return new DeleteResult<Message>("message", message, true);
  }

  async get(
    pk: Pick<Message, "thread_id" | "id">,
    context?: ThreadExecutionContext,
  ): Promise<Message> {
    return this.repository.findOne(pk);
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

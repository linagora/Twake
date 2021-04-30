import {
  SaveResult,
  OperationType,
  DeleteResult,
  ListResult,
  Pagination,
  CreateResult,
  ExecutionContext,
  UpdateResult,
} from "../../../../core/platform/framework/api/crud-service";
import { ResourcePath } from "../../../../core/platform/services/realtime/types";
import {
  logger,
  RealtimeDeleted,
  RealtimeSaved,
  TwakeContext,
} from "../../../../core/platform/framework";
import { DatabaseServiceAPI } from "../../../../core/platform/services/database/api";
import Repository from "../../../../core/platform/services/database/services/orm/repository/repository";
import { MessageServiceAPI, MessageThreadMessagesServiceAPI } from "../../api";
import { getInstance, Message, MessageReaction } from "../../entities/messages";
import { MessageLocalEvent, ThreadExecutionContext } from "../../types";
import { getThreadMessageWebsocketRoom } from "../../web/realtime";
import _ from "lodash";
import { localEventBus } from "../../../../core/platform/framework/pubsub";
import { ResourceEventsPayload } from "../../../types";

export class ThreadMessagesService implements MessageThreadMessagesServiceAPI {
  version: "1";
  repository: Repository<Message>;

  constructor(private database: DatabaseServiceAPI, private service: MessageServiceAPI) {}

  async init(context: TwakeContext): Promise<this> {
    this.repository = await this.database.getRepository<Message>("message", Message);
    return this;
  }

  async save<SaveOptions>(
    item: Message,
    options?: SaveOptions,
    context?: ThreadExecutionContext,
  ): Promise<SaveResult<Message>> {
    if (!context.serverRequest && !this.service.threads.checkAccessToThread(context)) {
      logger.error(`Unable to write in thread ${context.thread.id}`);
      throw Error("Can't write this message.");
    }

    let message = getInstance({
      id: undefined,
      ephemeral:
        (context.app?.id || context.serverRequest) && item.ephemeral ? item.ephemeral : null,
      company_id: context.thread.company_id,
      thread_id: context.thread.id,
      type: context.serverRequest && item.type === "event" ? "event" : "message",
      subtype: getSubtype(item, context),
      created_at: new Date().getTime(),
      user_id: context.user.id,
      application_id: context.app.id || null,
      text: item.text || "",
      blocks: item.blocks || [],
      files: item.files || null,
      context: item.context || null,
      edited: null, //Message cannot be created with edition status
      pinned_info: item.pinned_info
        ? {
            pinned_at: new Date().getTime(),
            pinned_by: context.user.id,
          }
        : null,
      reactions: null, // Reactions cannot be set on creation
      override:
        (context.app?.id || context.serverRequest) && item.override
          ? {
              title: item.override.title,
              picture: item.override.picture,
            }
          : null, // Only apps and server can set an override on a message
    });

    if (item.id) {
      //We try to update an existing message
      const messageToUpdate = await this.repository.findOne({
        company_id: context.thread.company_id,
        id: item.id,
        thread_id: context.thread.id,
      });

      //Test if we can update this message. Can edit only:
      // - Server itself
      // - Message owner
      // - Application owner
      // Deleted messages cannot be edited
      if (
        !messageToUpdate ||
        (!context.serverRequest &&
          context.app?.id !== messageToUpdate.application_id &&
          context.user.id !== messageToUpdate.user_id) ||
        messageToUpdate.subtype === "deleted"
      ) {
        logger.error(`Unable to edit message in thread ${message.thread_id}`);
        throw Error("Can't edit this message.");
      }

      messageToUpdate.edited = {
        edited_at: new Date().getTime(),
      };

      message = _.assign(messageToUpdate, _.pick(message, "text", "blocks", "files", "context"));
      if (context.app?.id || context.serverRequest) {
        message = _.assign(message, _.pick(message, "override"));
      }
    }

    logger.info(`Saved message in thread ${message.thread_id}`);

    if (!message.ephemeral) {
      await this.repository.save(message);
    }

    this.onSaved(message, { created: !item.id }, context);

    return new SaveResult<Message>(
      "message",
      message,
      item.id ? OperationType.UPDATE : OperationType.CREATE,
    );
  }

  async pin(
    operation: { id: string; pin: boolean },
    options: {},
    context: ThreadExecutionContext,
  ): Promise<SaveResult<Message>> {
    if (!context.serverRequest && !this.service.threads.checkAccessToThread(context)) {
      logger.error(`Unable to write in thread ${context.thread.id}`);
      throw Error("Can't edit this message.");
    }

    const message = await this.repository.findOne({
      company_id: context.thread.company_id,
      thread_id: context.thread.id,
      id: operation.id,
    });

    if (!message) {
      logger.error(`This message doesn't exists`);
      throw Error("Can't edit this message.");
    }

    message.pinned_info = operation.pin
      ? {
          pinned_by: context.user.id,
          pinned_at: new Date().getTime(),
        }
      : null;

    logger.info(
      `Updated message ${operation.id} pin to ${JSON.stringify(message.pinned_info)} thread ${
        message.thread_id
      }`,
    );
    await this.repository.save(message);
    this.onSaved(message, { created: false }, context);
    return new SaveResult<Message>("message", message, OperationType.UPDATE);
  }

  async reaction(
    operation: { id: string; reactions: string[] },
    options: {},
    context: ThreadExecutionContext,
  ): Promise<SaveResult<Message>> {
    if (!context.serverRequest && !this.service.threads.checkAccessToThread(context)) {
      logger.error(`Unable to write in thread ${context.thread.id}`);
      throw Error("Can't edit this message.");
    }

    const message = await this.repository.findOne({
      company_id: context.thread.company_id,
      thread_id: context.thread.id,
      id: operation.id,
    });

    if (!message) {
      logger.error(`This message doesn't exists`);
      throw Error("Can't edit this message.");
    }

    //Update message reactions
    updateMessageReactions(message, operation.reactions, context.user.id);

    logger.info(
      `Updated message ${operation.id} reactions to ${JSON.stringify(message.reactions)} thread ${
        message.thread_id
      }`,
    );
    await this.repository.save(message);
    this.onSaved(message, { created: false }, context);
    return new SaveResult<Message>("message", message, OperationType.UPDATE);
  }
  async bookmark(
    operation: { id: string; bookmark_id: string; active: boolean },
    options: {},
    context: ThreadExecutionContext,
  ): Promise<SaveResult<Message>> {
    const message = await this.repository.findOne({
      company_id: context.thread.company_id,
      thread_id: context.thread.id,
      id: operation.id,
    });

    if (!message) {
      logger.error(`This message doesn't exists`);
      throw Error("Can't edit this message.");
    }

    //TODO add message to user bookmarks

    return new SaveResult<Message>("message", message, OperationType.UPDATE);
  }

  async delete(pk: Message, context?: ThreadExecutionContext): Promise<DeleteResult<Message>> {
    if (!context.serverRequest && !this.service.threads.checkAccessToThread(context)) {
      logger.error(`Unable to write in thread ${context.thread.id}`);
      throw Error("Can't edit this message.");
    }

    const message = await this.repository.findOne({
      company_id: context.thread.company_id,
      thread_id: context.thread.id,
      id: pk.id,
    });

    if (!message) {
      logger.error(`This message doesn't exists`);
      throw Error("Can't delete this message.");
    }

    if (
      !context.serverRequest &&
      message.user_id !== context.user.id &&
      message.application_id !== context.app.id
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
    pk: Pick<Message, "company_id" | "thread_id" | "id">,
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
      { thread_id: context.thread.id, company_id: context.thread.company_id },
      { pagination },
    );
    return list;
  }

  @RealtimeSaved<Message>((message, context) => [
    {
      room: ResourcePath.get(getThreadMessageWebsocketRoom(context as ThreadExecutionContext)),
      path: getThreadMessageWebsocketRoom(context as ThreadExecutionContext) + "/" + message.id,
    },
  ])
  async onSaved(message: Message, options: { created: boolean }, context: ThreadExecutionContext) {
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
}

function getSubtype(
  item: Message,
  context?: ThreadExecutionContext,
): null | "application" | "deleted" | "system" {
  //Application request
  if (context.app.id) {
    return item.subtype === "application" ? "application" : null;
  }
  //System request
  else if (context.serverRequest) {
    return item.subtype;
  }

  //User cannot set a subtype itself
  return null;
}

function updateMessageReactions(message: Message, selectedReactions: string[], userId: string) {
  let reactions: { [key: string]: MessageReaction } = {};
  for (const reaction of message.reactions) {
    reactions[reaction.name] = reaction;
  }
  for (const reaction of selectedReactions) {
    reactions[reaction] = reactions[reaction] || { name: reaction, count: 0, users: [] };
  }
  for (const key in reactions) {
    if (reactions[key].users.includes(userId)) {
      reactions[key].count--;
      reactions[key].users = reactions[key].users.filter(u => u != userId);
    }
    if (selectedReactions.includes(key)) {
      reactions[key].count++;
      reactions[key].users.push(userId);
    }
  }
}

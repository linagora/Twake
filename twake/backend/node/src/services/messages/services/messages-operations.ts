import { OperationType, SaveResult } from "../../../core/platform/framework/api/crud-service";
import { logger, TwakeContext } from "../../../core/platform/framework";
import { Message, TYPE as MessageTableName } from "../entities/messages";
import {
  BookmarkOperation,
  DeleteLinkOperation,
  MessageFileDownloadEvent,
  PinOperation,
  ReactionOperation,
  ThreadExecutionContext,
  UpdateDeliveryStatusOperation,
} from "../types";
import emoji from "emoji-name-map";
import Repository from "../../../core/platform/services/database/services/orm/repository/repository";
import { ThreadMessagesService } from "./messages";
import gr from "../../global-resolver";
import { updateMessageReactions } from "../../../utils/messages";
import { localEventBus } from "../../../core/platform/framework/event-bus";
import { ReactionNotification } from "../../../services/notifications/types";
export class ThreadMessagesOperationsService {
  constructor(private threadMessagesService: ThreadMessagesService) {}
  repository: Repository<Message>;

  async init(context: TwakeContext): Promise<this> {
    this.repository = await gr.database.getRepository<Message>(MessageTableName, Message);
    return this;
  }

  async pin(
    operation: PinOperation,
    options: Record<string, unknown>,
    context: ThreadExecutionContext,
  ): Promise<SaveResult<Message>> {
    if (
      !context?.user?.server_request &&
      !gr.services.messages.threads.checkAccessToThread(context)
    ) {
      logger.error(`Unable to write in thread ${context.thread.id}`);
      throw Error("Can't edit this message.");
    }

    const message = await this.repository.findOne(
      {
        thread_id: context.thread.id,
        id: operation.id,
      },
      {},
      context,
    );

    if (!message) {
      logger.error("This message doesn't exists");
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
    await this.repository.save(message, context);
    this.threadMessagesService.onSaved(message, { created: false }, context);
    return new SaveResult<Message>("message", message, OperationType.UPDATE);
  }

  async reaction(
    operation: ReactionOperation,
    options: Record<string, unknown>,
    context: ThreadExecutionContext,
  ): Promise<SaveResult<Message>> {
    if (
      !context?.user?.server_request &&
      !gr.services.messages.threads.checkAccessToThread(context)
    ) {
      logger.error(`Unable to write in thread ${context.thread.id}`);
      throw Error("Can't edit this message.");
    }

    const message = await this.repository.findOne(
      {
        thread_id: context.thread.id,
        id: operation.id,
      },
      {},
      context,
    );

    if (!message) {
      logger.error("This message doesn't exists");
      throw Error("Can't edit this message.");
    }

    //Update message reactions
    updateMessageReactions(message, operation.reactions || [], context.user.id);

    logger.info(
      `Updated message ${operation.id} reactions to ${JSON.stringify(message.reactions)} thread ${
        message.thread_id
      }`,
    );
    await this.repository.save(message, context);

    if ((operation.reactions || []).length === 1 && context.user.id !== message.user_id) {
      await gr.platformServices.messageQueue.publish<ReactionNotification>(
        "notification:reaction",
        {
          data: {
            thread_id: context.thread.id,
            company_id: message.cache?.company_id || context.company.id,
            user_id: message.user_id,
            message_id: message.id,
            workspace_id: message.cache?.workspace_id,
            channel_id: message.cache?.channel_id,
            creation_date: new Date().getTime(),
            reaction: emoji.get(operation.reactions[0]),
            reaction_user_id: context.user.id,
          },
        },
      );
    }

    this.threadMessagesService.onSaved(message, { created: false }, context);
    return new SaveResult<Message>("message", message, OperationType.UPDATE);
  }

  async bookmark(
    operation: BookmarkOperation,
    options: Record<string, unknown>,
    context: ThreadExecutionContext,
  ): Promise<SaveResult<Message>> {
    const message = await this.repository.findOne(
      {
        thread_id: context.thread.id,
        id: operation.id,
      },
      {},
      context,
    );

    if (!message) {
      logger.error("This message doesn't exists");
      throw Error("Can't edit this message.");
    }

    //TODO add message to user bookmarks
    message.bookmarks = message.bookmarks.filter(
      b => !(b.user_id === context.user.id && b.bookmark_id === operation.bookmark_id),
    );
    if (operation.active) {
      message.bookmarks.push({
        user_id: context.user.id,
        bookmark_id: operation.bookmark_id,
        created_at: new Date().getTime(),
      });
    }

    logger.info(
      `Added bookmark to message ${operation.id} => ${JSON.stringify(
        message.bookmarks,
      )} to thread ${message.thread_id}`,
    );
    await this.repository.save(message, context);
    this.threadMessagesService.onSaved(message, { created: false }, context);

    return new SaveResult<Message>("message", message, OperationType.UPDATE);
  }

  async download(
    operation: { id: string; thread_id: string; message_file_id: string },
    options: Record<string, any>,
    context: ThreadExecutionContext,
  ) {
    //Register download action for reference
    localEventBus.publish("message:download", {
      user: context.user,
      operation: {
        message_id: operation.id,
        thread_id: operation.thread_id,
        message_file_id: operation.message_file_id,
      },
    } as MessageFileDownloadEvent);
  }

  /**
   * Delete a link preview from a message
   *
   * @param {DeleteLinkOperation} operation - params of the operation
   * @param {ThreadExecutionContext} context - Thread execution context
   * @returns {Promise<SaveResult<Message>>} - Result of the operation
   */
  async deleteLinkPreview(
    operation: DeleteLinkOperation,
    context: ThreadExecutionContext,
  ): Promise<SaveResult<Message>> {
    if (
      !context?.user?.server_request &&
      !gr.services.messages.threads.checkAccessToThread(context)
    ) {
      logger.error(`no access  ${context.thread.id}`);
      throw Error("can't remove link preview from message.");
    }

    const message = await this.repository.findOne(
      {
        thread_id: context.thread.id,
        id: operation.message_id,
      },
      {},
      context,
    );

    if (!message) {
      logger.error("This message doesn't exists");
      throw Error("Can't edit message links previews.");
    }

    if (context.user.id !== message.user_id) {
      logger.error("You can't remove link preview from another user message.");
      throw Error("Can't edit message links previews.");
    }

    message.links = message.links.filter(({ url }: { url: string }) => url !== operation.link);

    await this.repository.save(message, context);
    this.threadMessagesService.onSaved(message, { created: false }, context);

    return new SaveResult<Message>("message", message, OperationType.UPDATE);
  }

  /**
   * Update message delivery status operation
   *
   * @param {UpdateDeliveryStatusOperation} operation - the operation params
   * @param {ThreadExecutionContext} context - Thread execution context
   * @returns {Promise<SaveResult<Message>>} - Result of the operation
   */
  async updateDeliveryStatus(
    operation: UpdateDeliveryStatusOperation,
    context: ThreadExecutionContext,
  ): Promise<SaveResult<Message>> {
    if (
      !context?.user?.server_request &&
      !gr.services.messages.threads.checkAccessToThread(context)
    ) {
      logger.error(`no access  ${context.thread.id}`);
      throw Error("can't update message delivery status.");
    }

    if (!operation.message_id || !operation.status) {
      logger.error("Invalid operation");
      throw Error("Invalid operation");
    }

    if (operation.status !== "delivered" && operation.status !== "read") {
      logger.error("Invalid status");
      throw Error("Invalid status");
    }

    const message = await this.repository.findOne(
      {
        thread_id: context.thread.id,
        id: operation.message_id,
      },
      {},
      context,
    );

    if (!message) {
      logger.error("This message doesn't exists");
      throw Error("Can't update message delivery status.");
    }

    if (operation.status === "delivered" && message.status === "delivered") {
      logger.error("Message already delivered");
      return;
    }

    if (operation.status === "read" && message.status === "read") {
      logger.error("Message already read");
      return;
    }

    if (operation.status === "delivered" && message.status === "read" && !operation.self_message) {
      logger.error("Invalid operation");
      return;
    }

    message.status = operation.status;
    await this.repository.save(message, context);
    this.threadMessagesService.onSaved(message, { created: false }, context);

    return new SaveResult<Message>("message", message, OperationType.UPDATE);
  }
}

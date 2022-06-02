import { OperationType, SaveResult } from "../../../core/platform/framework/api/crud-service";
import { logger, TwakeContext } from "../../../core/platform/framework";
import { Message, TYPE as MessageTableName } from "../entities/messages";
import {
  BookmarkOperation,
  MessageFileDownloadEvent,
  PinOperation,
  ReactionOperation,
  ThreadExecutionContext,
} from "../types";

import Repository from "../../../core/platform/services/database/services/orm/repository/repository";
import { ThreadMessagesService } from "./messages";
import gr from "../../global-resolver";
import { updateMessageReactions } from "../../../utils/messages";
import { localEventBus } from "../../../core/platform/framework/pubsub";

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

    const message = await this.repository.findOne({
      thread_id: context.thread.id,
      id: operation.id,
    });

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
    await this.repository.save(message);
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

    const message = await this.repository.findOne({
      thread_id: context.thread.id,
      id: operation.id,
    });

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
    await this.repository.save(message);
    this.threadMessagesService.onSaved(message, { created: false }, context);
    return new SaveResult<Message>("message", message, OperationType.UPDATE);
  }

  async bookmark(
    operation: BookmarkOperation,
    options: Record<string, unknown>,
    context: ThreadExecutionContext,
  ): Promise<SaveResult<Message>> {
    const message = await this.repository.findOne({
      thread_id: context.thread.id,
      id: operation.id,
    });

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
    await this.repository.save(message);
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
}

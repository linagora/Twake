import { logger, TwakeContext } from "../../../../../../core/platform/framework";
import { MessageQueueHandler } from "../../../../../../core/platform/services/message-queue/api";
import { Message } from "../../../../entities/messages";
import Repository from "../../../../../../core/platform/services/database/services/orm/repository/repository";
import { LinkPreviewMessageQueueCallback } from "../../../../../previews/types";
import { Thread } from "../../../../entities/threads";
import { publishMessageInRealtime } from "../../../utils";
import { ExecutionContext } from "../../../../../../core/platform/framework/api/crud-service";

export class MessageLinksPreviewFinishedProcessor
  implements MessageQueueHandler<LinkPreviewMessageQueueCallback, string>
{
  constructor(
    private MessageRepository: Repository<Message>,
    private ThreadRepository: Repository<Thread>,
  ) {}
  readonly name = "MessageLinksPreviewFinishedProcessor";
  readonly topics = {
    in: "services:preview:links:callback",
  };

  readonly options = {
    unique: true,
    ack: true,
  };

  init?(context?: TwakeContext): Promise<this> {
    throw new Error("Method not implemented.");
  }

  validate(message: LinkPreviewMessageQueueCallback): boolean {
    return !!(message && message.previews && message.previews.length);
  }

  async process(
    localMessage: LinkPreviewMessageQueueCallback,
    context?: ExecutionContext,
  ): Promise<string> {
    logger.info(
      `${this.name} - updating message links with generated previews: ${localMessage.previews.length}`,
    );

    const entity = await this.MessageRepository.findOne(
      {
        thread_id: localMessage.message.resource.thread_id,
        id: localMessage.message.resource.id,
      },
      {},
      context,
    );

    if (!entity) {
      logger.error(`${this.name} - message not found`);
      return "";
    }

    entity.links = localMessage.previews;

    await this.MessageRepository.save(entity, context);

    const thread: Thread = await this.ThreadRepository.findOne(
      {
        id: localMessage.message.resource.thread_id,
      },
      {},
      context,
    );

    if (!thread) {
      logger.error(`${this.name} - thread not found`);
      return "";
    }

    const updatedMessage = {
      ...localMessage.message,
      resource: entity,
    };

    for (const participant of thread.participants.filter(p => p.type === "channel")) {
      publishMessageInRealtime(updatedMessage, participant);
    }

    return "done";
  }
}

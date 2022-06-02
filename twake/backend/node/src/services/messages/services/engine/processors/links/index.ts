import { logger, TwakeContext } from "../../../../../../core/platform/framework";
import { PubsubHandler } from "../../../../../../core/platform/services/pubsub/api";
import { Message } from "../../../../entities/messages";
import Repository from "../../../../../../core/platform/services/database/services/orm/repository/repository";
import { LinkPreviewPubsubCallback } from "../../../../../previews/types";

export class MessageLinksPreviewFinishedProcessor
  implements PubsubHandler<LinkPreviewPubsubCallback, string>
{
  constructor(private repository: Repository<Message>) {}
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

  validate(message: LinkPreviewPubsubCallback): boolean {
    return !!(message && message.previews && message.previews.length);
  }

  async process(message: LinkPreviewPubsubCallback): Promise<string> {
    logger.info(
      `${this.name} - updating message links with generated previews: ${message.previews.length}`,
    );

    const entity = await this.repository.findOne({
      thread_id: message.message.thread_id,
      id: message.message.id,
    });

    if (!entity) {
      logger.error(`${this.name} - message not found`);
      return "";
    }

    entity.links = message.previews;

    await this.repository.save(entity);

    return "done";
  }
}

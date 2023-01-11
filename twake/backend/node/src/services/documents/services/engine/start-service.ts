import { logger } from "../../../../core/platform/framework";
import { MessageQueueHandler } from "../../../../core/platform/services/message-queue/api";
import { DocumentsMessageQueueCallback, DocumentsMessageQueueRequest } from "../../types";

export class DocumentsProcessor
  implements MessageQueueHandler<DocumentsMessageQueueRequest, DocumentsMessageQueueCallback>
{
  readonly name = "DocumentsProcessor";

  readonly topics = {
    in: "services:documents:process",
    out: "services:documents:process:callback",
  };

  readonly options = {
    unique: true,
    ack: true,
  };

  validate(message: DocumentsMessageQueueRequest): boolean {
    return !!(
      message &&
      message.item &&
      message.item.id &&
      message.version &&
      message.version.file_id &&
      !message.item.is_directory
    );
  }

  async process(message: DocumentsMessageQueueRequest): Promise<DocumentsMessageQueueCallback> {
    logger.info(`${this.name} - process document content keywords for ${message.item.id}`);

    const result: DocumentsMessageQueueCallback = { content_keywords: "", item: message.item };

    return result;
  }

  async generate(message: DocumentsMessageQueueRequest): Promise<DocumentsMessageQueueCallback> {
    const content_keywords = "";

    try {
    } catch (error) {
      logger.error("Failed to generate content keywords", error);
      throw Error("Failed to generate content keywords");
    }

    return { content_keywords, item: message.item };
  }
}

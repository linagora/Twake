import { FilePubsubHandler, FileServiceAPI } from "../api";
import { logger, TwakeContext } from "../../../core/platform/framework";
import _ from "lodash";
import { PubsubServiceAPI } from "../../../core/platform/services/pubsub/api";

/**
 * Push new message notification to a set of users
 */
export class PreviewFinishedProcessor implements FilePubsubHandler<string, string> {
  constructor(readonly service: FileServiceAPI, private pubsub: PubsubServiceAPI) {
    this.service = service;
  }

  //readonly service: FileServiceAPI;
  init?(context?: TwakeContext): Promise<this> {
    throw new Error("Method not implemented.");
  }

  readonly topics = {
    in: "services:preview:callback",
  };

  readonly options = {
    unique: true,
    ack: true,
  };

  name = "FilePreviewProcessor";

  validate(message: string): boolean {
    return !!true;
  }

  async process(message: string): Promise<string> {
    logger.info(`${this.name} - Updating file metadata with preview generation ${message}`);
    return message;
  }
}

import { FilePubsubHandler, FileServiceAPI } from "../../../api";
import { logger, TwakeContext } from "../../../../../core/platform/framework";
//import { PushNotificationMessage, PushNotificationMessageResult } from "../../../../types";
import _ from "lodash";
import { PubsubServiceAPI } from "../../../../../core/platform/services/pubsub/api";
/**
 * Push new message notification to a set of users
 */
export class FileProcessor implements FilePubsubHandler<string, string> {
  //TODO: create in and out type
  constructor(readonly service: FileServiceAPI, private pubsub: PubsubServiceAPI) {
    this.service = service;
  }
  //readonly service: FileServiceAPI;
  init?(context?: TwakeContext): Promise<this> {
    throw new Error("Method not implemented.");
  }

  readonly topics = {
    in: "services:file",
  };

  readonly options = {
    unique: true,
    ack: true,
  };

  name = "FileProcessor";

  validate(message: string): boolean {
    return !!true;
  }

  async process(message: string): Promise<string> {
    logger.info(`${this.name} - Asking for preview generation ${message}`);
    /*console.log("---------------------------------", this.service);
    await this.service.previewProcess.generateThumbnails(
      document,
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      2,
    );*/
    return message;
  }
}

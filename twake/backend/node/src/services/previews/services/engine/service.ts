import { PreviewPubsubHandler, PreviewServiceAPI } from "../../api";
import { logger, TwakeContext } from "../../../../core/platform/framework";
//import { PushNotificationMessage, PushNotificationMessageResult } from "../../../../types";
import _ from "lodash";
import { PubsubServiceAPI } from "../../../../core/platform/services/pubsub/api";
import { PreviewPubsubCallback, PreviewPubsubRequest } from "../../types";
/**
 * Push new message notification to a set of users
 */
export class PreviewProcessor
  implements PreviewPubsubHandler<PreviewPubsubRequest, PreviewPubsubCallback> {
  //TODO: create in and out type
  constructor(service: PreviewServiceAPI, private pubsub: PubsubServiceAPI) {
    this.service = service;
  }
  service: PreviewServiceAPI;
  init?(context?: TwakeContext): Promise<this> {
    throw new Error("Method not implemented.");
  }

  readonly topics = {
    in: "services:preview",
    out: "services:preview:callback",
  };

  readonly options = {
    unique: true,
    ack: true,
  };

  name = "PreviewProcessor";

  validate(message: PreviewPubsubRequest): boolean {
    return !!true;
  }

  async process(message: PreviewPubsubRequest): Promise<PreviewPubsubCallback> {
    logger.info(`${this.name} - Processing preview generation ${message.document.id}`);
    console.log("---------------------------------");

    //TODO: Download the file from the provider and put it in a tmp folder before to generate preview

    let localThumbnails: { path: string; width: number; height: number }[] = [];
    try {
      localThumbnails = await this.service.previewProcess.generateThumbnails(
        message.document,
        message.output,
      );
    } catch {
      localThumbnails = [];
    }

    console.log(localThumbnails);

    //TODO: Upload every thumbnails to the provider localThumbnails -> thumbnails

    return { document: message.document, thumbnails: [] };
  }
}

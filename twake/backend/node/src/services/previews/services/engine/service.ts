import { PreviewPubsubHandler, PreviewServiceAPI } from "../../api";
import { logger, TwakeContext } from "../../../../core/platform/framework";
//import { PushNotificationMessage, PushNotificationMessageResult } from "../../../../types";
import _ from "lodash";
import { PubsubServiceAPI } from "../../../../core/platform/services/pubsub/api";
import { PreviewPubsubCallback, PreviewPubsubRequest } from "../../types";
import { getTmpFile } from "../../utils";
import fs from "fs";
import StorageAPI from "../../../../core/platform/services/storage/provider";

/**
 * Push new message notification to a set of users
 */
export class PreviewProcessor
  implements PreviewPubsubHandler<PreviewPubsubRequest, PreviewPubsubCallback> {
  //TODO: create in and out type
  constructor(
    service: PreviewServiceAPI,
    private pubsub: PubsubServiceAPI,
    readonly storage: StorageAPI,
  ) {
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

    //Download original file
    const readable = await this.storage.read(message.document.path, {
      totalChunks: message.document.chunks,
      encryptionAlgo: message.document.encryption_algo,
      encryptionKey: message.document.encryption_key,
    });
    const inputPath = getTmpFile();
    const writable = fs.createWriteStream(inputPath);
    readable.pipe(writable);

    console.log("Did download file for preview to " + inputPath);

    //Generate previews
    let localThumbnails: { path: string; width: number; height: number }[] = [];
    try {
      localThumbnails = await this.service.previewProcess.generateThumbnails(
        { path: inputPath, mime: message.document.mime, filename: message.document.filename },
        message.output,
      );
    } catch (err) {
      console.log("Preview generation failed because of ", err);
      localThumbnails = [];
    }

    console.log(localThumbnails);

    //TODO: Upload every thumbnails to the provider localThumbnails -> thumbnails;

    const document: PreviewPubsubCallback["document"] = {
      id: message.document.id,
      path: message.document.path,
      provider: "local",
    };
    const thumbnails: PreviewPubsubCallback["thumbnails"] = localThumbnails;
    try {
      this.service.pubsub.publish<PreviewPubsubCallback>("services:preview:callback", {
        data: { document, thumbnails },
      });
    } catch (err) {
      logger.warn({ err }, `Preview Callback - Error while sending `);
    }
    return { document: message.document, thumbnails: [] };
  }
}

import fs from "fs";
import { promises as fsPromise } from "fs";
import { PreviewPubsubHandler, PreviewServiceAPI } from "../../api";
import { logger, TwakeContext } from "../../../../core/platform/framework";
import { PubsubServiceAPI } from "../../../../core/platform/services/pubsub/api";
import { PreviewPubsubCallback, PreviewPubsubRequest, ThumbnailResult } from "../../types";
import { getTmpFile } from "../../utils";
import StorageAPI from "../../../../core/platform/services/storage/provider";

const { unlink } = fsPromise;
/**
 * Generate thumbnails when the upload is finished
 */
export class PreviewProcessor
  implements PreviewPubsubHandler<PreviewPubsubRequest, PreviewPubsubCallback>
{
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
    return !!(message && message.document && message.output);
  }

  async process(message: PreviewPubsubRequest): Promise<PreviewPubsubCallback> {
    logger.info(`${this.name} - Processing preview generation ${message.document.id}`);

    if (!this.validate(message)) {
      throw new Error("Missing required fields");
    }
    //Download original file
    const readable = await this.storage.read(message.document.path, {
      totalChunks: message.document.chunks,
      encryptionAlgo: message.document.encryption_algo,
      encryptionKey: message.document.encryption_key,
    });
    if (!readable) {
      return { document: message.document, thumbnails: [] };
    }

    const inputPath = getTmpFile();
    const writable = fs.createWriteStream(inputPath);
    readable.pipe(writable);
    await new Promise(r => {
      writable.on("finish", r);
    });
    writable.end();

    //Generate previews
    let localThumbnails: ThumbnailResult[] = [];

    try {
      localThumbnails = await this.service.previewProcess.generateThumbnails(
        { path: inputPath, mime: message.document.mime, filename: message.document.filename },
        message.output,
      );
    } catch (err) {
      localThumbnails = [];
    }

    const thumbnails: PreviewPubsubCallback["thumbnails"] = [];

    for (let i = 0; i < localThumbnails.length; i++) {
      const uploadThumbnailPath = `${message.output.path.replace(/\/$/, "")}/${i}.png`;
      const uploadThumbnail = fs.createReadStream(localThumbnails[i].path);

      await this.storage.write(uploadThumbnailPath, uploadThumbnail, {
        encryptionAlgo: message.output.encryption_algo,
        encryptionKey: message.output.encryption_key,
      });
      thumbnails.push({
        path: uploadThumbnailPath,
        size: localThumbnails[i].size,
        type: localThumbnails[i].type,
        width: localThumbnails[i].width,
        height: localThumbnails[i].height,
      });
      await unlink(localThumbnails[i].path);
    }

    return { document: message.document, thumbnails: thumbnails };
  }
}

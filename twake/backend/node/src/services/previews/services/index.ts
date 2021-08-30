import { PreviewServiceAPI } from "../api";
import { generatePreview as thumbnailsFromImages } from "./processing/image";
import { convertFromOffice } from "./processing/office";
import { convertFromPdf } from "./processing/pdf";
import { isFileType } from "../utils";
import { DatabaseServiceAPI } from "../../../core/platform/services/database/api";
import { PubsubServiceAPI } from "../../../core/platform/services/pubsub/api";
import { pdfExtensions, officeExtensions, imageExtensions } from "./processing/mime";
import StorageAPI from "../../../core/platform/services/storage/provider";
import sharp from "sharp";
import { logger } from "../../../core/platform/framework";
import { PreviewEngine } from "./engine";
import { getService as getPreviewProcessService } from "./processing/index";
import { PreviewProcessService } from "./processing/service";

export function getService(
  databaseService: DatabaseServiceAPI,
  pubsub: PubsubServiceAPI,
  storage: StorageAPI,
): PreviewServiceAPI {
  return getServiceInstance(databaseService, pubsub, storage);
}

function getServiceInstance(
  databaseService: DatabaseServiceAPI,
  pubsub: PubsubServiceAPI,
  storage: StorageAPI,
): PreviewServiceAPI {
  return new Service(databaseService, pubsub, storage);
}
class Service implements PreviewServiceAPI {
  version: "1";
  engine: PreviewEngine;
  previewProcess: PreviewProcessService;
  pubsub: PubsubServiceAPI;

  constructor(
    readonly database: DatabaseServiceAPI,
    pubsub: PubsubServiceAPI,
    readonly storage: StorageAPI,
  ) {
    this.previewProcess = getPreviewProcessService();
    this.engine = new PreviewEngine(this, pubsub);
    this.pubsub = pubsub;
  }

  async init(): Promise<this> {
    try {
      await this.engine.init();
    } catch (err) {
      console.error("Error while initializing preview service", err);
    }
    return this;
  }
}

import { PreviewServiceAPI } from "../api";
import { generatePreview as thumbnailsFromImages } from "./image";
import { convertFromOffice } from "./office";
import { convertFromPdf } from "./pdf";
import { isFileType } from "../utils";
import { DatabaseServiceAPI } from "../../../core/platform/services/database/api";
import { PubsubServiceAPI } from "../../../core/platform/services/pubsub/api";
import { pdfExtensions, officeExtensions, imageExtensions } from "./mime";
import StorageAPI from "../../../core/platform/services/storage/provider";
import sharp from "sharp";

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

  constructor(
    readonly database: DatabaseServiceAPI,
    readonly pubsub: PubsubServiceAPI,
    readonly storage: StorageAPI,
  ) {}

  async generateThumbnails(
    document: { id: string; path: string; provider: string },
    mime: string,
    numberOfPages: number, //can be removed if we decide the number max of page that we can convert in thumbnails
  ): Promise<sharp.OutputInfo> {
    const outputPath = document.path.split(".");
    outputPath.pop();
    outputPath.push("png");
    const output = `${outputPath.join(".")}`;
    if (isFileType(mime, document.path.split("/").pop(), officeExtensions)) {
      const pdfPath = await convertFromOffice(document, numberOfPages);
      const thumbnailPath = await convertFromPdf(pdfPath, numberOfPages);
      return thumbnailsFromImages(thumbnailPath, output);
    }

    if (isFileType(mime, document.path.split("/").pop(), pdfExtensions)) {
      const thumbnailPath = await convertFromPdf(document.path, numberOfPages);
      return thumbnailsFromImages(thumbnailPath, output);
    }

    if (isFileType(mime, document.path.split("/").pop(), imageExtensions)) {
      return thumbnailsFromImages(document.path, output);
    }
  }
}

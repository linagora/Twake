import { PreviewServiceAPI } from "../../api";
import { generatePreview as thumbnailsFromImages } from "./image";
import { convertFromOffice } from "./office";
import { convertFromPdf } from "./pdf";
import { isFileType } from "../../utils";
import { DatabaseServiceAPI } from "../../../../core/platform/services/database/api";
import { PubsubServiceAPI } from "../../../../core/platform/services/pubsub/api";
import { pdfExtensions, officeExtensions, imageExtensions } from "./mime";
import StorageAPI from "../../../../core/platform/services/storage/provider";
import sharp from "sharp";
import { logger } from "../../../../core/platform/framework";
import { PreviewEngine } from "../engine";
import { PreviewPubsubRequest } from "../../types";

export class PreviewProcessService {
  name: "PreviewProcessService";
  version: "1";

  async generateThumbnails(
    document: PreviewPubsubRequest["document"],
    options: PreviewPubsubRequest["output"],
  ): Promise<{ path: string; width: number; height: number }[]> {
    if (isFileType(document.mime, document.filename, officeExtensions)) {
      const pdfPath = await convertFromOffice(document.path, options.pages);
      const thumbnailPath = await convertFromPdf(pdfPath.output, options.pages);
      return (await thumbnailsFromImages(thumbnailPath.output)).output;
    }

    if (isFileType(document.mime, document.filename, pdfExtensions)) {
      const thumbnailPath = await convertFromPdf(document.path, options.pages);
      return (await thumbnailsFromImages(thumbnailPath.output)).output;
    }

    if (isFileType(document.mime, document.filename, imageExtensions)) {
      return (await thumbnailsFromImages([document.path])).output;
    }
  }
}

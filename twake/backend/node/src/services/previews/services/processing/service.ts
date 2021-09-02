import { generatePreview as thumbnailsFromImages } from "./image";
import { convertFromOffice } from "./office";
import { convertFromPdf } from "./pdf";
import { isFileType } from "../../utils";
import { pdfExtensions, officeExtensions, imageExtensions } from "./mime";
import StorageAPI from "../../../../core/platform/services/storage/provider";
import { PreviewPubsubRequest, ThumbnailResult } from "../../types";

export class PreviewProcessService {
  name: "PreviewProcessService";
  version: "1";

  constructor(readonly storage: StorageAPI) {}

  async generateThumbnails(
    document: Pick<PreviewPubsubRequest["document"], "filename" | "mime" | "path">,
    options: PreviewPubsubRequest["output"],
  ): Promise<ThumbnailResult[]> {
    if (isFileType(document.mime, document.filename, officeExtensions)) {
      const pdfPath = await convertFromOffice(document.path, options.pages);
      const thumbnailPath = await convertFromPdf(pdfPath.output, options.pages);
      return (await thumbnailsFromImages(thumbnailPath.output, options)).output;
    }

    if (isFileType(document.mime, document.filename, pdfExtensions)) {
      const thumbnailPath = await convertFromPdf(document.path, options.pages);
      return (await thumbnailsFromImages(thumbnailPath.output, options)).output;
    }

    if (isFileType(document.mime, document.filename, imageExtensions)) {
      return (await thumbnailsFromImages([document.path], options)).output;
    }
  }
}

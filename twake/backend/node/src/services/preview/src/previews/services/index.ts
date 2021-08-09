import { PreviewServiceAPI } from "../api";
import { generatePreview as thumbnailsFromImages } from "./image";
import { convertFromOffice } from "./office";
import { convertFromPdf } from "./pdf";
import { isFileType } from "./mime";
import { pdfExtensions, officeExtensions, imageExtensions } from "./mime";

export function getService(): PreviewServiceAPI {
  return getServiceInstance();
}

function getServiceInstance(): PreviewServiceAPI {
  return new Service();
}
class Service implements PreviewServiceAPI {
  version: "1";

  constructor() {}

  async generateThumbnails(
    mime: string,
    inputPath: string,
    outputPath: string,
    outputExtension: string,
    numberOfPages: number,
  ): Promise<any> {
    if (isFileType(mime, inputPath.split("/").pop(), officeExtensions)) {
      const pdfPath = await convertFromOffice(inputPath, outputPath, numberOfPages);
      const thumbnailPath = await convertFromPdf(pdfPath, numberOfPages);
      thumbnailsFromImages(thumbnailPath, outputPath, outputExtension);
    }

    if (isFileType(mime, inputPath.split("/").pop(), pdfExtensions)) {
      const thumbnailPath = await convertFromPdf(inputPath, numberOfPages);
      thumbnailsFromImages(thumbnailPath, outputPath, outputExtension);
    }

    if (isFileType(mime, inputPath.split("/").pop(), imageExtensions)) {
      thumbnailsFromImages(inputPath, outputPath, outputExtension);
    }
  }
}

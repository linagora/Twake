import { PreviewServiceAPI } from "../api";
import { generatePreview as thumbnailsFromImages } from "./image";
import { convertFromOffice } from "./office";
import { convertFromPdf } from "./pdf";
import { isFileType } from "../utils";
import { pdfExtensions, officeExtensions, imageExtensions } from "./mime";
import sharp from "sharp";

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

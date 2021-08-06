import { PreviewServiceAPI } from "../api";
import { generatePreview as thumbnailsFromImages } from "./image";
import { convertFromOffice } from "./office";
import { convertFromPdf } from "./pdf";
import { isFileType } from "./mime";
import mimes from "./mime";
import pdfExtensions from "./mime";
import officeExtensions from "./mime";
import imageExtensions from "./mime";

export function getService(): PreviewServiceAPI {
  return getServiceInstance();
}

function getServiceInstance(): PreviewServiceAPI {
  return new Service();
}
class Service implements PreviewServiceAPI {
  version: "1";

  constructor() {}

  async get(
    //generateThumbnails
    mime: string,
    inputPath: string,
    outputPath: string,
    outputExtension: string,
    numberOfPages: number,
  ): Promise<any> {
    if (isFileType(mime, inputPath.split("/").pop(), officeExtensions)) {
      await convertFromOffice(inputPath, outputPath, numberOfPages);
      //await convertFromPdf(inputPath, outputPath);
      //thumbnailsFromImages(inputPath, outputPath, outputExtension);
    }

    if (isFileType(mime, inputPath.split("/").pop(), pdfExtensions)) {
      await convertFromPdf(inputPath, outputPath);
      thumbnailsFromImages(inputPath, outputPath, outputExtension);
    }

    if (isFileType(mime, inputPath.split("/").pop(), imageExtensions)) {
      thumbnailsFromImages(inputPath, outputPath, outputExtension);
    }
  }
}

//https://www.thoughtco.com/mime-types-by-content-type-3469108

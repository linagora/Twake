import { FastifyRequest, FastifyReply } from "fastify";
import { PreviewServiceAPI } from "../../api";

/*
  //Input parameters

  "document": {
	  "id": "uuid",
    "path": "a path",
    "provider": "S3"
  },
  "output": {
    "path": "a path",
    "provider": "S3",
    "pages": 10, //Max number of pages for the document
    "width": 400, //Max width for the thumbnails
    "height": 400 //Max height for the thumbnails
  }
*/

export class PreviewController {
  constructor(protected service: PreviewServiceAPI) {}

  async get(
    request: FastifyRequest<{ Params: { id: string } }>,
    response: FastifyReply,
  ): Promise<any> {
    const inputPath =
      "/Users/t_issarni/twake/Twake/twake/backend/node/src/services/preview/test.docx";
    const mime = "application/vnd.openxmlformats-officedocument.wordprocessingml.document";
    const outputPath = `${inputPath.split(".")[0]}_temp`;
    const outputExtension = "png";
    const numberOfPages = 1;
    const result = await this.service.get(
      mime,
      inputPath,
      outputPath,
      outputExtension,
      numberOfPages,
    );
    response.send("computing");
  }
}

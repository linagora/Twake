import { FastifyRequest, FastifyReply } from "fastify";
import { PreviewServiceAPI } from "../../api";
import { PubsubService } from "../../../../core/platform/services/pubsub/index";
import { PubsubMessage } from "../../../../core/platform/services/pubsub/api";
import { logger } from "../../../../core/platform/framework";
import { PreviewPubsubRequest } from "../../types";

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
    console.log("Current working directory: " + __dirname);
    const inputPath =
      "/usr/src/app/src/services/previews/Fiche_de_poste_tca_2020_Titouan-Issarni_LINAGORA.docx"; //"/Users/t_issarni/twake/Twake/twake/backend/node/src/services/previews/test.docx";
    const mime = "application/vnd.openxmlformats-officedocument.wordprocessingml.document";
    const outputPath = `${inputPath.split(".")[0]}_temp`;
    const outputExtension = "png";
    const numberOfPages = 1;
    const provider = "local";
    const document: PreviewPubsubRequest["document"] = {
      id: request.id,
      path: inputPath,
      provider,
      filename: inputPath.split("/").pop(),
      mime,
    };
    const output = { path: "/usr/src/app/src/services/previews/", provider: "local", pages: 10 };

    try {
      this.service.pubsub.publish<PreviewPubsubRequest>("services:preview", {
        data: { document, output },
      });
    } catch (err) {
      logger.warn({ err }, `Previewing - Error while sending `);
    }
    //const result = await this.service.generateThumbnails(document, mime, numberOfPages);
    response.send("computing");
  }
}

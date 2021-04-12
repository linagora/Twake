import { FastifyRequest, FastifyReply } from "fastify";
import { CrudController } from "../../../../core/platform/services/webserver/types";
import {
  ResourceCreateResponse,
  ResourceDeleteResponse,
  ResourceGetResponse,
  ResourceListResponse,
} from "../../../../services/types";
import { File } from "../../entities/file";
import { FileServiceAPI } from "../../api";
import fs from "fs";
import util from "util";
import { pipeline } from "stream";

const pump = util.promisify(pipeline);

export class FileController {
  constructor(protected service: FileServiceAPI) {}

  async save(request: FastifyRequest<{}>, response: FastifyReply) {
    const data = await request.file();
    data.file;
    data.fields;
    data.fieldname;
    data.filename;
    data.encoding;
    data.mimetype;

    await pump(data.file, fs.createWriteStream(data.filename));
    response.send("file uploaded");
  }

  list(request: FastifyRequest<{}>, response: FastifyReply) {
    response.send("hello");
  }

  async delete(request: FastifyRequest<{}>): Promise<ResourceDeleteResponse> {
    return new ResourceDeleteResponse();
  }
}

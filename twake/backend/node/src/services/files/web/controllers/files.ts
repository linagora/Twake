import { FastifyRequest, FastifyReply } from "fastify";
import { ResourceDeleteResponse } from "../../../../services/types";
import { FileServiceAPI } from "../../api";

export class FileController {
  constructor(protected service: FileServiceAPI) {}

  async save(request: FastifyRequest<{}>, response: FastifyReply) {
    const data = await request.file();
    const fields: any = request.query;
    this.service.save({ data, fields });
    response.send();
  }

  async delete(request: FastifyRequest<{}>): Promise<ResourceDeleteResponse> {
    return new ResourceDeleteResponse();
  }
}

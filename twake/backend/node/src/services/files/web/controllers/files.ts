import { FastifyRequest, FastifyReply } from "fastify";
import { ResourceDeleteResponse } from "../../../../services/types";
import { FileServiceAPI } from "../../api";

export class FileController {
  constructor(protected service: FileServiceAPI) {}

  async save(request: FastifyRequest<{ Params: { company_id: string } }>, response: FastifyReply) {
    const data = await request.file();
    const fields: any = request.query;
    const company_id = request.params.company_id;
    this.service.save({ data, fields, company_id });
    response.send();
  }

  async get(
    request: FastifyRequest<{ Params: { company_id: string; id: string } }>,
    response: FastifyReply,
  ) {
    const params = request.params;
    console.log(request);
    const stream = await this.service.download(params.company_id, params.id);

    response.header("Content-disposition", "attachment; filename=");
    response.type("image/png");
    response.send(stream);
  }

  async delete(request: FastifyRequest<{}>): Promise<ResourceDeleteResponse> {
    return new ResourceDeleteResponse();
  }
}

//http://localhost:3000/internal/services/files/v1/companies/1f739ac3-6a5b-4bba-893b-3b4481758a11/files/80bf5348-1120-4cbb-8a9d-1075726b2c9b/download

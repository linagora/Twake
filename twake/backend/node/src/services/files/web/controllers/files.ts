import { FastifyRequest, FastifyReply } from "fastify";
import { Multipart } from "fastify-multipart";
import { ResourceDeleteResponse } from "../../../../services/types";
import { CompanyExecutionContext } from "../types";
import { FileServiceAPI } from "../../api";

export class FileController {
  constructor(protected service: FileServiceAPI) {}

  async save(
    request: FastifyRequest<{ Params: { company_id: string; file_id: string } }>,
    response: FastifyReply,
  ) {
    const context = getCompanyExecutionContext(request);
    let data: null | Multipart = null;
    if (request.isMultipart()) {
      data = await request.file();
    }
    const fields: any = request.query;
    const file_id = request.params.file_id;
    const company_id = request.params.company_id;
    const result = await this.service.save({ data, fields, file_id, company_id }, context);

    response.send({
      resource: result,
    });
  }

  async get(
    request: FastifyRequest<{ Params: { company_id: string; id: string } }>,
    response: FastifyReply,
  ) {
    const context = getCompanyExecutionContext(request);
    const params = request.params;
    const stream = await this.service.download(params.company_id, params.id, context);

    //TO-DO: récuprer infos bd dont mime et nom du ficher
    response.header("Content-disposition", "attachment; filename=");
    response.type("image/png");
    response.send(stream);
  }

  async delete(request: FastifyRequest<{}>): Promise<ResourceDeleteResponse> {
    return new ResourceDeleteResponse();
  }
}

function getCompanyExecutionContext(
  request: FastifyRequest<{
    Params: { company_id: string };
  }>,
): CompanyExecutionContext {
  return {
    user: request.currentUser,
    company: { id: request.params.company_id },
    url: request.url,
    method: request.routerMethod,
    reqId: request.id,
    transport: "http",
  };
}

//url for DL
//http://localhost:3000/internal/services/files/v1/companies/1f739ac3-6a5b-4bba-893b-3b4481758a11/files/80bf5348-1120-4cbb-8a9d-1075726b2c9b/download

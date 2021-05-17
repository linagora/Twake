import { FastifyRequest, FastifyReply } from "fastify";
import { Multipart } from "fastify-multipart";
import { ResourceDeleteResponse } from "../../../../services/types";
import { CompanyExecutionContext } from "../types";
import { FileServiceAPI, UploadOptions } from "../../api";

export class FileController {
  constructor(protected service: FileServiceAPI) {}

  async save(
    request: FastifyRequest<{
      Params: { company_id: string; id: string };
      Querystring: any;
    }>,
    response: FastifyReply,
  ) {
    const context = getCompanyExecutionContext(request);

    let file: null | Multipart = null;
    if (request.isMultipart()) {
      file = await request.file();
    }
    const q = request.query;
    let options: UploadOptions = {
      totalChunks: parseInt(q.resumableTotalChunks || q.total_chunks) || 0,
      totalSize: parseInt(q.resumableTotalSize || q.total_size) || 0,
      chunkNumber: parseInt(q.resumableChunkNumber || q.chunk_number) || 0,
      filename: q.resumableFilename || q.filename || file?.filename || undefined,
      type: q.resumableType || q.type || file?.mimetype || undefined,
    };

    const id = request.params.id;
    const result = await this.service.save(id, file, options, context);

    response.send({
      resource: result,
    });
  }

  async download(
    request: FastifyRequest<{ Params: { company_id: string; id: string } }>,
    response: FastifyReply,
  ) {
    const context = getCompanyExecutionContext(request);
    const params = request.params;
    const data = await this.service.download(params.id, context);
    const filename = data.name.replace(/[^a-zA-Z0-9 ]/g, "");

    response.header("Content-disposition", `attachment; filename="${filename}"`);
    response.header("Content-Length", data.size);
    response.type(data.mime);
    response.send(data.file);
  }

  async get(request: FastifyRequest<{ Params: { company_id: string; id: string } }>) {
    const context = getCompanyExecutionContext(request);
    const params = request.params;
    const data = await this.service.get(params.id, context);
    return { resource: data };
  }

  async delete(request: FastifyRequest<{}>): Promise<ResourceDeleteResponse> {
    throw "Not implemented";
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

import { FastifyRequest, FastifyReply } from "fastify";
import { Multipart } from "fastify-multipart";
import { ResourceDeleteResponse } from "../../../../utils/types";
import { CompanyExecutionContext } from "../types";
import { FileServiceAPI, UploadOptions } from "../../api";
import { File } from "../../entities/file";

export class FileController {
  constructor(protected service: FileServiceAPI) {}

  async save(
    request: FastifyRequest<{
      Params: { company_id: string; id: string };
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      Querystring: any;
    }>,
    response: FastifyReply,
  ): Promise<void> {
    const context = getCompanyExecutionContext(request);

    let file: null | Multipart = null;
    if (request.isMultipart()) {
      file = await request.file();
    }
    const q = request.query;
    const options: UploadOptions = {
      totalChunks: parseInt(q.resumableTotalChunks || q.total_chunks) || 1,
      totalSize: parseInt(q.resumableTotalSize || q.total_size) || 0,
      chunkNumber: parseInt(q.resumableChunkNumber || q.chunk_number) || 1,
      filename: q.resumableFilename || q.filename || file?.filename || undefined,
      type: q.resumableType || q.type || file?.mimetype || undefined,
      waitForThumbnail: q.thumbnail_sync,
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
  ): Promise<void> {
    const context = getCompanyExecutionContext(request);
    const params = request.params;
    const data = await this.service.download(params.id, context);
    const filename = data.name.replace(/[^a-zA-Z0-9 -_.]/g, "");

    response.header("Content-disposition", `attachment; filename="${filename}"`);
    if (data.size) response.header("Content-Length", data.size);
    response.type(data.mime);
    response.send(data.file);
  }

  async thumbnail(
    request: FastifyRequest<{ Params: { company_id: string; id: string; index: string } }>,
    response: FastifyReply,
  ): Promise<void> {
    const context = getCompanyExecutionContext(request);
    const params = request.params;
    const data = await this.service.thumbnail(params.id, params.index, context);

    response.header("Content-disposition", "inline");
    if (data.size) response.header("Content-Length", data.size);
    response.type(data.type);
    response.send(data.file);
  }

  async get(
    request: FastifyRequest<{ Params: { company_id: string; id: string } }>,
  ): Promise<{ resource: File }> {
    const context = getCompanyExecutionContext(request);
    const params = request.params;
    const resource = await this.service.get(params.id, context);

    return { resource };
  }

  async delete(): Promise<ResourceDeleteResponse> {
    throw new Error("Not implemented");
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

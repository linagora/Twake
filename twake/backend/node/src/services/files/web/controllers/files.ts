import { FastifyReply, FastifyRequest } from "fastify";
import { Multipart } from "fastify-multipart";
import { ResourceDeleteResponse, ResourceListResponse } from "../../../../utils/types";
import { CompanyExecutionContext } from "../types";
import { UploadOptions } from "../../api";
import { File, PublicFile } from "../../entities/file";
import gr from "../../../global-resolver";
import {
  CrudException,
  ListResult,
  Pagination,
} from "../../../../core/platform/framework/api/crud-service";
import uuid from "node-uuid";
import { expect } from "@jest/globals";
import { type } from "os";

export class FileController {
  async save(
    request: FastifyRequest<{
      Params: { company_id: string; id: string };
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      Querystring: any;
    }>,
  ): Promise<{ resource: PublicFile }> {
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
    const result = await gr.services.files.save(id, file, options, context);

    return {
      resource: result.getPublicObject(),
    };
  }

  async download(
    request: FastifyRequest<{ Params: { company_id: string; id: string } }>,
    response: FastifyReply,
  ): Promise<void> {
    const context = getCompanyExecutionContext(request);
    const params = request.params;
    const data = await gr.services.files.download(params.id, context);
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
    try {
      const data = await gr.services.files.thumbnail(params.id, params.index, context);

      response.header("Content-disposition", "inline");
      if (data.size) response.header("Content-Length", data.size);
      response.type(data.type);
      response.send(data.file);
    } catch (err) {
      console.log(err);
      response.statusCode = 500;
      response.send("");
    }
  }

  async get(
    request: FastifyRequest<{ Params: { company_id: string; id: string } }>,
  ): Promise<{ resource: PublicFile }> {
    const context = getCompanyExecutionContext(request);
    const params = request.params;
    const resource = await gr.services.files.get(params.id, context);

    return { resource: resource.getPublicObject() };
  }

  async delete(
    request: FastifyRequest<{ Params: { company_id: string; id: string } }>,
  ): Promise<ResourceDeleteResponse> {
    const params = request.params;
    const context = getCompanyExecutionContext(request);

    const deleteResult = await gr.services.files.delete(params.id, context);

    return { status: deleteResult.deleted ? "success" : "error" };
  }

  async list(
    request: FastifyRequest<{
      Params: { company_id: string };
      Querystring: { page_token: null; limit: 100; type: "user_upload" | "user_download" };
    }>,
  ): Promise<ResourceListResponse<PublicFile>> {
    if (request.query.type !== "user_upload") {
      throw CrudException.notImplemented(`Not implemented for type ${request.query.type}`);
    }

    const userFiles = await gr.services.files.listUserUploadedFiles(
      request.currentUser.id,
      getCompanyExecutionContext(request),
      new Pagination(request.query.page_token, String(request.query.limit)),
    );

    return {
      resources: userFiles.getEntities().map(a => a.getPublicObject()),
      next_page_token: userFiles.nextPage.page_token,
    };
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

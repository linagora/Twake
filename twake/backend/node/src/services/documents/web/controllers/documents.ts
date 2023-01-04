import { FastifyReply, FastifyRequest } from "fastify";
import { logger } from "../../../../core/platform/framework";
import { CrudException } from "../../../../core/platform/framework/api/crud-service";
import { File } from "../../../../services/files/entities/file";
import { UploadOptions } from "../../../../services/files/types";
import globalResolver from "../../../../services/global-resolver";
import { PaginationQueryParameters } from "../../../../utils/types";
import { DriveFile } from "../../entities/drive-file";
import { FileVersion } from "../../entities/file-version";
import {
  CompanyExecutionContext,
  DownloadZipBodyRequest,
  DriveItemDetails,
  ItemRequestParams,
  RequestParams,
} from "../../types";

export class DocumentsController {
  /**
   * Creates a DriveFile item
   *
   * @param {FastifyRequest} request
   * @returns
   */
  create = async (
    request: FastifyRequest<{
      Params: RequestParams;
      Querystring: Record<string, string>;
      Body: {
        item: Partial<DriveFile>;
        version: Partial<FileVersion>;
      };
    }>,
  ): Promise<DriveFile> => {
    try {
      const context = getCompanyExecutionContext(request);

      let createdFile: File = null;
      if (request.isMultipart()) {
        const file = await request.file();
        const q = request.query;
        const options: UploadOptions = {
          totalChunks: parseInt(q.resumableTotalChunks || q.total_chunks) || 1,
          totalSize: parseInt(q.resumableTotalSize || q.total_size) || 0,
          chunkNumber: parseInt(q.resumableChunkNumber || q.chunk_number) || 1,
          filename: q.resumableFilename || q.filename || file?.filename || undefined,
          type: q.resumableType || q.type || file?.mimetype || undefined,
          waitForThumbnail: !!q.thumbnail_sync,
        };

        createdFile = await globalResolver.services.files.save(null, file, options, context);
      }

      const { item, version } = request.body;

      return await globalResolver.services.documents.create(createdFile, item, version, context);
    } catch (error) {
      logger.error("Failed to create Drive item", error);
      throw new CrudException("Failed to create Drive item", 500);
    }
  };

  /**
   * Deletes a DriveFile item or empty the trash or delete root folder contents
   *
   * @param {FastifyRequest} request
   * @returns {Promise<void>}
   */
  delete = async (request: FastifyRequest<{ Params: ItemRequestParams }>): Promise<void> => {
    const context = getCompanyExecutionContext(request);

    return await globalResolver.services.documents.delete(request.params.id, null, context);
  };

  /**
   * Lists the drive root folder.
   *
   * @param {FastifyRequest} request
   * @returns {Promise<DriveItemDetails>}
   */
  listRootFolder = async (
    request: FastifyRequest<{ Params: RequestParams; Querystring: PaginationQueryParameters }>,
  ): Promise<DriveItemDetails> => {
    const context = getCompanyExecutionContext(request);

    return await globalResolver.services.documents.get("", context);
  };

  /**
   * Fetches a DriveFile item.
   *
   * @param {FastifyRequest} request
   * @returns {Promise<DriveItemDetails>}
   */
  get = async (
    request: FastifyRequest<{ Params: ItemRequestParams; Querystring: PaginationQueryParameters }>,
  ): Promise<DriveItemDetails> => {
    const context = getCompanyExecutionContext(request);
    const { id } = request.params;

    return await globalResolver.services.documents.get(id, context);
  };

  /**
   *
   * @param {FastifyRequest} request
   * @returns
   */
  update = async (
    request: FastifyRequest<{ Params: ItemRequestParams; Body: Partial<DriveFile> }>,
  ): Promise<DriveFile> => {
    const context = getCompanyExecutionContext(request);
    const { id } = request.params;
    const update = request.body;

    return await globalResolver.services.documents.update(id, update, context);
  };

  createVersion = async (
    request: FastifyRequest<{ Params: ItemRequestParams; Body: Partial<FileVersion> }>,
  ): Promise<FileVersion> => {
    const context = getCompanyExecutionContext(request);
    const { id } = request.params;
    const version = request.body;

    return await globalResolver.services.documents.createVersion(id, version, context);
  };

  downloadZip = async (
    request: FastifyRequest<{ Params: RequestParams; Body: DownloadZipBodyRequest }>,
    reply: FastifyReply,
  ) => {
    const context = getCompanyExecutionContext(request);
    const ids = request.body.items;

    const archive = await globalResolver.services.documents.createZip(ids, context);

    archive.on("finish", () => {
      reply.status(200);
    });

    archive.on("error", () => {
      reply.internalServerError();
    });

    archive.pipe(await reply);

    archive.finalize();
  };
}

/**
 * Gets the company execution context
 *
 * @param { FastifyRequest<{ Params: { company_id: string } }>} req
 * @returns {CompanyExecutionContext}
 */
const getCompanyExecutionContext = (
  req: FastifyRequest<{ Params: { company_id: string } }>,
): CompanyExecutionContext => ({
  user: req.currentUser,
  company: { id: req.params.company_id },
  url: req.url,
  method: req.routerMethod,
  reqId: req.id,
  transport: "http",
});

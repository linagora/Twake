import { FastifyReply, FastifyRequest } from "fastify";
import { logger } from "../../../../core/platform/framework";
import { CrudException, ListResult } from "../../../../core/platform/framework/api/crud-service";
import { File } from "../../../../services/files/entities/file";
import { UploadOptions } from "../../../../services/files/types";
import globalResolver from "../../../../services/global-resolver";
import { PaginationQueryParameters, ResourceWebsocket } from "../../../../utils/types";
import { DriveFile } from "../../entities/drive-file";
import { FileVersion } from "../../entities/file-version";
import {
  CompanyExecutionContext,
  DriveExecutionContext,
  DriveItemDetails,
  ItemRequestParams,
  RequestParams,
  SearchDocumentsBody,
  SearchDocumentsOptions,
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
      const context = getDriveExecutionContext(request);

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

      return await globalResolver.services.documents.documents.create(
        createdFile,
        item,
        version,
        context,
      );
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
  delete = async (
    request: FastifyRequest<{ Params: ItemRequestParams; Querystring: { public_token?: string } }>,
  ): Promise<void> => {
    const context = getDriveExecutionContext(request);

    return await globalResolver.services.documents.documents.delete(
      request.params.id,
      null,
      context,
    );
  };

  /**
   * Lists the drive root folder.
   *
   * @param {FastifyRequest} request
   * @returns {Promise<DriveItemDetails>}
   */
  listRootFolder = async (
    request: FastifyRequest<{
      Params: RequestParams;
      Querystring: PaginationQueryParameters & { public_token?: string };
    }>,
  ): Promise<DriveItemDetails> => {
    const context = getDriveExecutionContext(request);

    return await globalResolver.services.documents.documents.get(null, context);
  };

  /**
   * Fetches a DriveFile item.
   *
   * @param {FastifyRequest} request
   * @returns {Promise<DriveItemDetails>}
   */
  get = async (
    request: FastifyRequest<{
      Params: ItemRequestParams;
      Querystring: PaginationQueryParameters & { public_token?: string };
    }>,
  ): Promise<DriveItemDetails & { websockets: ResourceWebsocket[] }> => {
    const context = getDriveExecutionContext(request);
    const { id } = request.params;

    return {
      ...(await globalResolver.services.documents.documents.get(id, context)),
      websockets: request.currentUser?.id
        ? globalResolver.platformServices.realtime.sign(
            [{ room: `/companies/${context.company.id}/documents/item/${id}` }],
            request.currentUser?.id,
          )
        : [],
    };
  };

  /**
   * Update drive item
   *
   * @param {FastifyRequest} request
   * @returns {Promise<DriveFile>}
   */
  update = async (
    request: FastifyRequest<{
      Params: ItemRequestParams;
      Body: Partial<DriveFile>;
      Querystring: { public_token?: string };
    }>,
  ): Promise<DriveFile> => {
    const context = getDriveExecutionContext(request);
    const { id } = request.params;
    const update = request.body;

    return await globalResolver.services.documents.documents.update(id, update, context);
  };

  /**
   * Create a drive file version.
   *
   * @param {FastifyRequest} request
   * @returns {Promise<FileVersion>}
   */
  createVersion = async (
    request: FastifyRequest<{
      Params: ItemRequestParams;
      Body: Partial<FileVersion>;
      Querystring: { public_token?: string };
    }>,
  ): Promise<FileVersion> => {
    const context = getDriveExecutionContext(request);
    const { id } = request.params;
    const version = request.body;

    return await globalResolver.services.documents.documents.createVersion(id, version, context);
  };

  downloadGetToken = async (
    request: FastifyRequest<{
      Params: ItemRequestParams;
      Querystring: { version_id?: string; items?: string; public_token?: string };
    }>,
  ): Promise<{ token: string }> => {
    const ids = (request.query.items || "").split(",");
    const context = getDriveExecutionContext(request);
    return {
      token: await globalResolver.services.documents.documents.downloadGetToken(
        ids,
        request.query.version_id,
        context,
      ),
    };
  };

  /**
   * Shortcut to download a file (you can also use the file-service directly).
   * If the item is a folder, a zip will be automatically generated.
   *
   * @param {FastifyRequest} request
   * @param {FastifyReply} reply
   */
  download = async (
    request: FastifyRequest<{
      Params: ItemRequestParams;
      Querystring: { version_id?: string; token?: string; public_token?: string };
    }>,
    response: FastifyReply,
  ): Promise<void> => {
    const context = getDriveExecutionContext(request);
    const id = request.params.id || "";
    const versionId = request.query.version_id || null;
    const token = request.query.token;
    await globalResolver.services.documents.documents.applyDownloadTokenToContext(
      [id],
      versionId,
      token,
      context,
    );

    try {
      const archiveOrFile = await globalResolver.services.documents.documents.download(
        id,
        versionId,
        context,
      );

      if (archiveOrFile.archive) {
        const archive = archiveOrFile.archive;

        archive.on("finish", () => {
          response.status(200);
        });

        archive.on("error", () => {
          response.internalServerError();
        });

        archive.pipe(response.raw);

        archive.finalize();
      } else if (archiveOrFile.file) {
        const data = archiveOrFile.file;
        const filename = data.name.replace(/[^a-zA-Z0-9 -_.]/g, "");

        response.header("Content-disposition", `attachment; filename="${filename}"`);
        if (data.size) response.header("Content-Length", data.size);
        response.type(data.mime);
        response.send(data.file);
      }
    } catch (error) {
      logger.error("failed to download file", error);
      throw new CrudException("Failed to download file", 500);
    }
  };

  /**
   * Downloads a zip archive containing the drive items.
   *
   * @param {FastifyRequest} request
   * @param {FastifyReply} reply
   */
  downloadZip = async (
    request: FastifyRequest<{
      Params: RequestParams;
      Querystring: { token?: string; items: string; public_token?: string };
    }>,
    reply: FastifyReply,
  ): Promise<void> => {
    const context = getDriveExecutionContext(request);
    const ids = (request.query.items || "").split(",");
    const token = request.query.token;

    await globalResolver.services.documents.documents.applyDownloadTokenToContext(
      ids,
      null,
      token,
      context,
    );

    try {
      const archive = await globalResolver.services.documents.documents.createZip(ids, context);

      archive.on("finish", () => {
        reply.status(200);
      });

      archive.on("error", () => {
        reply.internalServerError();
      });

      archive.pipe(reply.raw);

      archive.finalize();
    } catch (error) {
      logger.error("failed to send zip file", error);
      throw new CrudException("Failed to create zip file", 500);
    }
  };
  /**
   * Search for documents.
   *
   * @param {FastifyRequest} request
   * @returns {Promise<ListResult<DriveFile>>}
   */
  search = async (
    request: FastifyRequest<{
      Params: RequestParams;
      Body: SearchDocumentsBody;
      Querystring: { public_token?: string };
    }>,
  ): Promise<ListResult<DriveFile>> => {
    try {
      const context = getDriveExecutionContext(request);
      const { search = "", added = "", company_id = "", creator = "" } = request.body;

      const options: SearchDocumentsOptions = {
        ...(search ? { search } : {}),
        ...(added ? { added } : {}),
        ...(company_id ? { company_id } : {}),
        ...(creator ? { creator } : {}),
      };

      if (!Object.keys(options).length) {
        throw Error("Search options are empty");
      }

      return await globalResolver.services.documents.documents.search(options, context);
    } catch (error) {
      logger.error("error while searching for document", error);
      throw new CrudException("Failed to search for documents", 500);
    }
  };
}

/**
 * Gets the company execution context
 *
 * @param { FastifyRequest<{ Params: { company_id: string } }>} req
 * @returns {CompanyExecutionContext}
 */
const getDriveExecutionContext = (
  req: FastifyRequest<{ Params: { company_id: string }; Querystring: { public_token?: string } }>,
): DriveExecutionContext => ({
  public_token: req.query.public_token,
  user: req.currentUser,
  company: { id: req.params.company_id },
  url: req.url,
  method: req.routerMethod,
  reqId: req.id,
  transport: "http",
});

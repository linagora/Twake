import { randomBytes } from "crypto";
import { Readable } from "stream";
import { Multipart } from "fastify-multipart";
import { FileServiceAPI, UploadOptions } from "../api";
import { File, PublicFile } from "../entities/file";
import Repository from "../../../../src/core/platform/services/database/services/orm/repository/repository";
import { CompanyExecutionContext } from "../web/types";
import { logger } from "../../../core/platform/framework";
import { PreviewClearPubsubRequest, PreviewPubsubRequest } from "../../previews/types";
import { PreviewFinishedProcessor } from "./preview";
import _ from "lodash";
import { getDownloadRoute, getThumbnailRoute } from "../web/routes";
import {
  CrudException,
  DeleteResult,
  ListResult,
  Paginable,
  Pagination,
} from "../../../core/platform/framework/api/crud-service";
import gr from "../../global-resolver";
import { MessageFileRef } from "../../messages/entities/message-file-refs";
import { MessageFile } from "../../messages/entities/message-files";
import { localEventBus } from "../../../core/platform/framework/pubsub";
import { formatUser } from "../../../utils/users";
import { UserObject } from "../../user/web/types";

export class FileServiceImpl implements FileServiceAPI {
  version: "1";
  repository: Repository<File>;
  private algorithm = "aes-256-cbc";
  private max_preview_file_size = 50000000;
  private messageFileRepository: Repository<MessageFile>;
  private messageFileRefsRepository: Repository<MessageFileRef>;

  async init(): Promise<this> {
    try {
      await Promise.all([
        (this.repository = await gr.database.getRepository<File>("files", File)),
        (this.messageFileRefsRepository = await gr.database.getRepository<MessageFileRef>(
          "message_file_refs",
          MessageFileRef,
        )),
        (this.messageFileRepository = await gr.database.getRepository<MessageFile>(
          "message_files",
          MessageFile,
        )),
        gr.platformServices.pubsub.processor.addHandler(
          new PreviewFinishedProcessor(this, this.repository),
        ),
      ]);
    } catch (err) {
      logger.error("Error while initializing files service", err);
    }
    return this;
  }

  async save(
    id: string,
    file: Multipart,
    options: UploadOptions,
    context: CompanyExecutionContext,
  ): Promise<File> {
    const userId = context.user?.id;
    const applicationId: string | null = context.user?.application_id || null;

    let entity: File = null;
    if (id) {
      entity = await this.repository.findOne({
        company_id: context.company.id,
        id: id,
      });
      if (!entity) {
        throw new Error(`This file ${id} does not exist`);
      }
    }

    if (!entity) {
      entity = new File();
      entity.company_id = `${context.company.id}`;
      entity.metadata = null;
      entity.thumbnails = [];

      const iv = randomBytes(8).toString("hex");
      const secret_key = randomBytes(16).toString("hex");
      entity.encryption_key = `${secret_key}.${iv}`;

      entity.user_id = userId;
      entity.application_id = applicationId;
      entity.upload_data = null;

      this.repository.save(entity);
    }

    if (file) {
      // Detect a new file upload
      // Only applications can overwrite a file.
      // Users alone can only write an empty file.
      if (applicationId || !entity.upload_data?.size || context.user.server_request) {
        if (
          //If there was any change to the file
          entity.upload_data?.size !== options.totalSize ||
          entity.metadata?.name !== options.filename
        ) {
          entity.metadata = {
            name: options.filename,
            mime: options.type,
            thumbnails_status: "done",
          };
          entity.upload_data = {
            size: options.totalSize,
            chunks: options.totalChunks || 1,
          };
          this.repository.save(entity);
        }
      }

      let totalUploadedSize = 0;
      file.file.on("data", function (chunk) {
        totalUploadedSize += chunk.length;
      });
      await gr.platformServices.storage.write(getFilePath(entity), file.file, {
        chunkNumber: options.chunkNumber,
        encryptionAlgo: this.algorithm,
        encryptionKey: entity.encryption_key,
      });

      if (entity.upload_data.chunks === 1 && totalUploadedSize) {
        entity.upload_data.size = totalUploadedSize;
        await this.repository.save(entity);
      }

      //Fixme: detect in multichunk when all chunks are uploaded to trigger this. For now we do only single chunks for preview
      if (entity.upload_data.chunks === 1 && totalUploadedSize) {
        /** Send preview generation task */
        if (entity.upload_data.size < this.max_preview_file_size) {
          const document: PreviewPubsubRequest["document"] = {
            id: JSON.stringify(_.pick(entity, "id", "company_id")),
            provider: gr.platformServices.storage.getConnectorType(),

            path: getFilePath(entity),
            encryption_algo: this.algorithm,
            encryption_key: entity.encryption_key,
            chunks: entity.upload_data.chunks,

            filename: entity.metadata.name,
            mime: entity.metadata.mime,
          };
          const output = {
            provider: gr.platformServices.storage.getConnectorType(),
            path: `${getFilePath(entity)}/thumbnails/`,
            encryption_algo: this.algorithm,
            encryption_key: entity.encryption_key,
            pages: 10,
          };

          entity.metadata.thumbnails_status = "waiting";
          await this.repository.save(entity);

          try {
            await gr.platformServices.pubsub.publish<PreviewPubsubRequest>("services:preview", {
              data: { document, output },
            });

            if (options.waitForThumbnail) {
              for (let i = 1; i < 10; i++) {
                entity = await this.repository.findOne({
                  company_id: context.company.id,
                  id: entity.id,
                });
                if (entity.metadata.thumbnails_status === "done") {
                  break;
                }
                await new Promise(r => setTimeout(r, i * 200));
              }
            }
          } catch (err) {
            entity.metadata.thumbnails_status = "error";
            await this.repository.save(entity);

            logger.warn({ err }, "Previewing - Error while sending ");
          }
        }

        /** End preview generation task generation */
      }
    }

    return entity;
  }

  async download(
    id: string,
    context: CompanyExecutionContext,
  ): Promise<{ file: Readable; name: string; mime: string; size: number }> {
    const entity = await this.get(id, context);
    if (!entity) {
      throw "File not found";
    }

    const readable = await gr.platformServices.storage.read(getFilePath(entity), {
      totalChunks: entity.upload_data.chunks,
      encryptionAlgo: this.algorithm,
      encryptionKey: entity.encryption_key,
    });

    return {
      file: readable,
      name: entity.metadata.name,
      mime: entity.metadata.mime,
      size: entity.upload_data.size,
    };
  }

  async thumbnail(
    id: string,
    index: string,
    context: CompanyExecutionContext,
  ): Promise<{ file: Readable; type: string; size: number }> {
    const entity = await this.get(id, context);

    if (!entity) {
      throw "File not found";
    }

    const thumbnail = entity.thumbnails[parseInt(index)];
    if (!thumbnail) {
      throw `Thumbnail ${parseInt(index)} not found`;
    }

    const thumbnailPath = `${getFilePath(entity)}/thumbnails/${thumbnail.id}`;

    const readable = await gr.platformServices.storage.read(thumbnailPath, {
      encryptionAlgo: this.algorithm,
      encryptionKey: entity.encryption_key,
    });

    return {
      file: readable,
      type: thumbnail.type,
      size: thumbnail.size,
    };
  }

  get(id: string, context: CompanyExecutionContext): Promise<File> {
    if (!id || !context.company.id) {
      return null;
    }
    return this.repository.findOne({ id, company_id: context.company.id });
  }

  getThumbnailRoute(file: File, index: string) {
    return getThumbnailRoute(file, index);
  }

  getDownloadRoute(file: File) {
    return getDownloadRoute(file);
  }

  async delete(id: string, context: CompanyExecutionContext): Promise<DeleteResult<File>> {
    const fileToDelete = await this.get(id, context);

    if (!fileToDelete) {
      throw new CrudException("File not found", 404);
    }

    await this.repository.remove(fileToDelete);

    const path = getFilePath(fileToDelete);

    await gr.platformServices.storage.remove(path, {
      totalChunks: fileToDelete.upload_data.chunks,
    });

    if (fileToDelete.thumbnails.length > 0) {
      await gr.platformServices.pubsub.publish<PreviewClearPubsubRequest>(
        "services:preview:clear",
        {
          data: {
            document: {
              id: JSON.stringify(_.pick(fileToDelete, "id", "company_id")),
              provider: gr.platformServices.storage.getConnectorType(),
              path: `${path}/thumbnails/`,
              thumbnails_number: fileToDelete.thumbnails.length,
            },
          },
        },
      );
    }

    return new DeleteResult("files", fileToDelete, true);
  }

  async listUserMarkedFiles(
    userId: string,
    type: "user_upload" | "user_download" | "both",
    media: "file_only" | "media_only" | "both",
    context: CompanyExecutionContext,
    pagination: Pagination,
  ): Promise<ListResult<PublicFile>> {
    let files: File[] = [];
    let nextPageUploads: Paginable;
    let nextPageDownloads: Paginable;
    do {
      const uploads =
        type === "user_upload" || type === "both"
          ? await this.messageFileRefsRepository
              .find(
                { target_type: "user_upload", target_id: userId, company_id: context.company.id },
                {
                  pagination: { ...pagination, page_token: nextPageUploads?.page_token },
                },
              )
              .then(a => {
                nextPageUploads = a.nextPage;
                return a.getEntities();
              })
          : [];

      const downloads =
        type === "user_download" || type === "both"
          ? await this.messageFileRefsRepository
              .find(
                { target_type: "user_download", target_id: userId, company_id: context.company.id },
                {
                  pagination: { ...pagination, page_token: nextPageDownloads?.page_token },
                },
              )
              .then(a => {
                nextPageDownloads = a.nextPage;
                return a.getEntities();
              })
          : [];

      let refs = [...uploads, ...downloads];

      const messageFilePromises: Promise<MessageFile>[] = refs
        .map(ref => {
          try {
            this.messageFileRepository.findOne({
              message_id: ref.message_id,
              id: ref.message_file_id,
            });
          } catch (e) {
            return null;
          }
        })
        .filter(a => a);

      const messageFiles = await Promise.all(messageFilePromises);

      const filePromises: Promise<File>[] = messageFiles
        .filter(ref => ref)
        .map(async ref =>
          this.repository.findOne({
            company_id: ref.metadata.external_id.company_id,
            id: ref.metadata.external_id.id,
          }),
        )
        .filter(a => a);

      files = [...files, ...(await Promise.all(filePromises))].filter(ref => {
        //Apply media filer
        const isMedia =
          ref.metadata?.mime?.startsWith("video/") || ref.metadata?.mime?.startsWith("image/");
        return !((media === "file_only" && isMedia) || (media === "media_only" && !isMedia));
      });
      files = files.sort((a, b) => b.created_at - a.created_at);
    } while (
      files.length < (parseInt(pagination.limitStr) || 100) &&
      (nextPageDownloads?.page_token || nextPageUploads?.page_token)
    );

    const fileWithUserPromise: Promise<PublicFile & { user: UserObject }>[] = files.map(
      async file => ({
        user: await formatUser(await gr.services.users.get({ id: file.user_id })),
        ...file.getPublicObject(),
      }),
    );
    const fileWithUser = await Promise.all(fileWithUserPromise);

    return new ListResult<PublicFile>("file", fileWithUser, nextPageUploads || nextPageDownloads);
  }
}

function getFilePath(entity: File): string {
  return `/twake/files/${entity.company_id}/${entity.user_id || "anonymous"}/${entity.id}`;
}

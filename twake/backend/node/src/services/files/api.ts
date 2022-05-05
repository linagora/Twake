import { Readable } from "stream";
import { Multipart } from "fastify-multipart";
import { Initializable, TwakeServiceProvider } from "../../core/platform/framework";
import { CompanyExecutionContext } from "./web/types";
import { File } from "./entities/file";
import { PubsubHandler } from "../../core/platform/services/pubsub/api";
import {
  DeleteResult,
  ListResult,
  Pagination,
} from "../../core/platform/framework/api/crud-service";

export type UploadOptions = {
  filename: string;
  type: string;
  totalSize: number;
  totalChunks: number;
  chunkNumber: number;
  waitForThumbnail: boolean;
};

export type DeleteOptions = {
  totalChunks?: number;
};

export interface FileServiceAPI extends TwakeServiceProvider, Initializable {
  /**
   * Save a file and returns its entity
   *
   * @param id
   * @param file
   * @param options
   * @param context
   */
  save(
    id: string,
    file: Multipart,
    options: UploadOptions,
    context: CompanyExecutionContext,
  ): Promise<File>;

  /**
   * Get a file as readable and metadata information from its ID
   *
   * @param id
   * @param context
   */
  download(
    id: string,
    context: CompanyExecutionContext,
  ): Promise<{ file: Readable; name: string; mime: string; size: number }>;

  /**
   * Get a thumbnail for download by index
   *
   * @param id
   * @param context
   */
  thumbnail(
    id: string,
    index: string,
    context: CompanyExecutionContext,
  ): Promise<{ file: Readable; type: string; size: number }>;

  /**
   * Get a file entity from its id
   *
   * @param id
   * @param context
   */
  get(id: string, context: CompanyExecutionContext): Promise<File>;

  /**
   * Delete a file entity from its id
   *
   * @param id
   * @param context
   */
  delete(id: string, context: CompanyExecutionContext): Promise<DeleteResult<File>>;

  getThumbnailRoute(file: File, index: string): string;
  getDownloadRoute(file: File): string;

  listUserUploadedFiles(
    userId: string,
    context: CompanyExecutionContext,
    pagination: Pagination,
  ): Promise<ListResult<File>>;
}

export interface FilePubsubHandler<InputMessage, OutputMessage>
  extends PubsubHandler<InputMessage, OutputMessage> {
  readonly service: FileServiceAPI;
}

import { Readable } from "node:stream";
import { TwakeServiceProvider, Initializable } from "../../core/platform/framework/api";
import { CompanyExecutionContext } from "./web/types";
import { File } from "./entities/file";
import { Multipart } from "fastify-multipart";

export type UploadOptions = {
  filename: string;
  type: string;
  totalSize: number;
  totalChunks: number;
  chunkNumber: number;
};

export interface FileServiceAPI extends TwakeServiceProvider, Initializable {
  save(id: string, file: Multipart, options: UploadOptions, context: CompanyExecutionContext): any;
  download(
    id: string,
    context: CompanyExecutionContext,
  ): Promise<{ file: Readable; name: string; mime: string; size: number }>;
  get(id: string, context: CompanyExecutionContext): Promise<File>;
}

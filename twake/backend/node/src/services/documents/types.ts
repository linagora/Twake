import { ExecutionContext } from "src/core/platform/framework/api/crud-service";
import { DriveFile } from "./entities/drive-file";
import { FileVersion } from "./entities/file-version";

export interface CompanyExecutionContext extends ExecutionContext {
  company: { id: string };
}

export type DriveItemDetails = {
  item?: DriveFile;
  versions?: FileVersion[];
  children: DriveFile[];
};

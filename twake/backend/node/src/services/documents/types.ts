import { ExecutionContext } from "../../core/platform/framework/api/crud-service";
import { DriveFile } from "./entities/drive-file";
import { FileVersion } from "./entities/file-version";

export interface CompanyExecutionContext extends ExecutionContext {
  company: { id: string };
}

export type RequestParams = {
  company_id: string;
};

export type ItemRequestParams = RequestParams & {
  id: string;
};

export type DriveItemDetails = {
  path: DriveFile[];
  item?: DriveFile;
  versions?: FileVersion[];
  children: DriveFile[];
  access: DriveFileAccessLevel | "none";
};

export type DriveFileAccessLevel = "read" | "write" | "manage";
export type publicAccessLevel = "write" | "read" | "none";

export type RootType = "root";
export type TrashType = "trash";

export type DownloadZipBodyRequest = {
  items: string[];
};

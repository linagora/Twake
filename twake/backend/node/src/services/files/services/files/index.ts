import { DatabaseServiceAPI } from "../../../../core/platform/services/database/api";
import { FileServiceAPI } from "../../api";
import { FileService } from "./service";

export function getService(databaseService: DatabaseServiceAPI): FileServiceAPI {
  return new FileService(databaseService);
}

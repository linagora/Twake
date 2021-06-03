import { DatabaseServiceAPI } from "../../../../core/platform/services/database/api";
import { WorkspaceService } from "./service";

export function getService(database: DatabaseServiceAPI): WorkspaceService {
  return new WorkspaceService(database);
}

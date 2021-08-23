import { UsersServiceAPI } from "../../../user/api";
import { DatabaseServiceAPI } from "../../../../core/platform/services/database/api";
import { WorkspaceService } from "./service";

export function getService(database: DatabaseServiceAPI, user: UsersServiceAPI): WorkspaceService {
  return new WorkspaceService(database, user);
}

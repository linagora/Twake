import { UsersServiceAPI } from "../../../user/api";
import { DatabaseServiceAPI } from "../../../../core/platform/services/database/api";
import { WorkspaceService } from "./service";
import { CounterAPI } from "../../../../core/platform/services/counter/types";

export function getService(
  database: DatabaseServiceAPI,
  user: UsersServiceAPI,
  counters: CounterAPI,
): WorkspaceService {
  return new WorkspaceService(database, user, counters);
}

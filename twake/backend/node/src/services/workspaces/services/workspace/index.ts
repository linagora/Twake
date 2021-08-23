import { UsersServiceAPI } from "../../../user/api";
import { DatabaseServiceAPI } from "../../../../core/platform/services/database/api";
import { WorkspaceService } from "./service";
import { CounterProvider } from "../../../../core/platform/services/counter/provider";

export function getService(
  database: DatabaseServiceAPI,
  user: UsersServiceAPI,
  counters: CounterProvider,
): WorkspaceService {
  return new WorkspaceService(database, user, counters);
}

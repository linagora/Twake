import { UsersServiceAPI } from "../../../user/api";
import { DatabaseServiceAPI } from "../../../../core/platform/services/database/api";
import { WorkspaceService } from "./service";
import { PubsubServiceAPI } from "../../../../core/platform/services/pubsub/api";

export function getService(
  database: DatabaseServiceAPI,
  user: UsersServiceAPI,
  pubsub: PubsubServiceAPI,
): WorkspaceService {
  return new WorkspaceService(database, user, pubsub);
}

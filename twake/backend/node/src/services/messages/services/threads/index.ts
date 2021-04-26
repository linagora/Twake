import { DatabaseServiceAPI } from "../../../../core/platform/services/database/api";
import { MessageThreadsServiceAPI } from "../../api";
import { ThreadsService } from "./service";

export function getService(databaseService: DatabaseServiceAPI): MessageThreadsServiceAPI {
  return new ThreadsService(databaseService);
}

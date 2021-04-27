import { DatabaseServiceAPI } from "../../../../core/platform/services/database/api";
import { MessageServiceAPI, MessageThreadsServiceAPI } from "../../api";
import { ThreadsService } from "./service";

export function getService(
  databaseService: DatabaseServiceAPI,
  service: MessageServiceAPI,
): MessageThreadsServiceAPI {
  return new ThreadsService(databaseService, service);
}

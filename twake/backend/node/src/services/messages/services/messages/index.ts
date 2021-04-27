import { DatabaseServiceAPI } from "../../../../core/platform/services/database/api";
import { MessageServiceAPI, MessageThreadMessagesServiceAPI } from "../../api";
import { ThreadMessagesService } from "./service";

export function getService(
  databaseService: DatabaseServiceAPI,
  service: MessageServiceAPI,
): MessageThreadMessagesServiceAPI {
  return new ThreadMessagesService(databaseService, service);
}

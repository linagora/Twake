import { DatabaseServiceAPI } from "../../../../core/platform/services/database/api";
import { MessageThreadMessagesServiceAPI } from "../../api";
import { ThreadMessagesService } from "./service";

export function getService(databaseService: DatabaseServiceAPI): MessageThreadMessagesServiceAPI {
  return new ThreadMessagesService(databaseService);
}

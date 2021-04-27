import { DatabaseServiceAPI } from "../../../../core/platform/services/database/api";
import { MessageServiceAPI, MessageViewsServiceAPI } from "../../api";
import { ViewsService } from "./service";

export function getService(
  databaseService: DatabaseServiceAPI,
  service: MessageServiceAPI,
): MessageViewsServiceAPI {
  return new ViewsService(databaseService, service);
}

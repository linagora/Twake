import { DatabaseServiceAPI } from "../../../../core/platform/services/database/api";
import { MessageViewsServiceAPI } from "../../api";
import { ViewsService } from "./service";

export function getService(databaseService: DatabaseServiceAPI): MessageViewsServiceAPI {
  return new ViewsService(databaseService);
}

import { DatabaseServiceAPI } from "../../../../core/platform/services/database/api";
import { MessageUserBookmarksServiceAPI } from "../../api";
import { UserBookmarksService } from "./service";

export function getService(databaseService: DatabaseServiceAPI): MessageUserBookmarksServiceAPI {
  return new UserBookmarksService(databaseService);
}

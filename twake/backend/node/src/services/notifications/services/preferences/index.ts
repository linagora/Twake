import { DatabaseServiceAPI } from "../../../../core/platform/services/database/api";
import { NotificationPreferencesService } from "./service";

export function getService(databaseService: DatabaseServiceAPI): NotificationPreferencesService {
  return new NotificationPreferencesService(databaseService);
}

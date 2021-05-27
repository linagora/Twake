import { DatabaseServiceAPI } from "../../../../core/platform/services/database/api";
import { MobilePushService } from "./service";
import { PushServiceAPI } from "../../../../core/platform/services/push/api";

export function getService(
  databaseService: DatabaseServiceAPI,
  push: PushServiceAPI,
): MobilePushService {
  return new MobilePushService(databaseService, push);
}

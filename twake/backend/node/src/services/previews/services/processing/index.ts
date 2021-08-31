import { DatabaseServiceAPI } from "../../../../core/platform/services/database/api";
import { PreviewProcessService } from "./service";
import { PushServiceAPI } from "../../../../core/platform/services/push/api";
import StorageAPI from "../../../../core/platform/services/storage/provider";

export function getService(storage: StorageAPI): PreviewProcessService {
  return new PreviewProcessService(storage);
}

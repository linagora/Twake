import { DatabaseServiceAPI } from "../../../../core/platform/services/database/api";
import { PreviewProcessService } from "./service";
import { PushServiceAPI } from "../../../../core/platform/services/push/api";

export function getService(): PreviewProcessService {
  return new PreviewProcessService();
}

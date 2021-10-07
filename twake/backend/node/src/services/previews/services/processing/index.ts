import { PreviewProcessService } from "./service";
import StorageAPI from "../../../../core/platform/services/storage/provider";

export function getService(storage: StorageAPI): PreviewProcessService {
  return new PreviewProcessService(storage);
}

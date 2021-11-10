import { MessageServiceAPI, MessageViewsServiceAPI } from "../../api";
import { ViewsService } from "./service";
import { PlatformServicesAPI } from "../../../../core/platform/services/platform-services";

export function getService(
  platformServices: PlatformServicesAPI,
  service: MessageServiceAPI,
): MessageViewsServiceAPI {
  return new ViewsService(platformServices, service);
}

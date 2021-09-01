import { UsersServiceAPI } from "../../../user/api";
import { WorkspaceService } from "./service";
import { PlatformServicesAPI } from "../../../../core/platform/services/platform-services";
import { PubsubServiceAPI } from "../../../../core/platform/services/pubsub/api";

export function getService(
  platformServices: PlatformServicesAPI,
  user: UsersServiceAPI,
): WorkspaceService {
  return new WorkspaceService(platformServices, user);
}

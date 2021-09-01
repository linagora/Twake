import { UsersServiceAPI } from "../../../user/api";
import { WorkspaceService } from "./service";
import { PlatformServicesAPI } from "../../../../core/platform/services/platform-services";

export function getService(
  platformServices: PlatformServicesAPI,
  user: UsersServiceAPI,
): WorkspaceService {
  return new WorkspaceService(platformServices, user);
}

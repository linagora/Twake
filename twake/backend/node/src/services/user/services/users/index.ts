import { UserService } from "./service";
import { PlatformServicesAPI } from "../../../../core/platform/services/platform-services";

export function getService(platformServices: PlatformServicesAPI): UserService {
  return new UserService(platformServices);
}

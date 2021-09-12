import { UsersServiceAPI, CompaniesServiceAPI } from "../../../user/api";
import { WorkspaceService } from "./service";
import { PlatformServicesAPI } from "../../../../core/platform/services/platform-services";
import { ApplicationServiceAPI } from "../../../applications/api";

export function getService(
  platformServices: PlatformServicesAPI,
  user: UsersServiceAPI,
  companies: CompaniesServiceAPI,
  applications: ApplicationServiceAPI,
): WorkspaceService {
  return new WorkspaceService(platformServices, user, companies, applications);
}

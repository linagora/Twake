import { UsersServiceAPI, CompaniesServiceAPI } from "../../../user/api";
import { Service } from "./service";
import { PlatformServicesAPI } from "../../../../core/platform/services/platform-services";
import { ApplicationServiceAPI } from "../../../applications/api";
import AuthServiceAPI from "../../../../core/platform/services/auth/provider";
import { WorkspaceService } from "../../api";

export function getService(
  platformServices: PlatformServicesAPI,
  user: UsersServiceAPI,
  companies: CompaniesServiceAPI,
  applications: ApplicationServiceAPI,
  auth: AuthServiceAPI,
): WorkspaceService {
  return new Service(platformServices, user, companies, applications, auth);
}

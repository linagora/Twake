import { CompaniesServiceAPI, UsersServiceAPI } from "../../api";
import { CompanyService } from "./service";
import { PlatformServicesAPI } from "../../../../core/platform/services/platform-services";

export function getService(
  platformServices: PlatformServicesAPI,
  usersServiceAPI: UsersServiceAPI,
): CompaniesServiceAPI {
  return new CompanyService(platformServices, usersServiceAPI);
}

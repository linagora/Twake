import { DatabaseServiceAPI } from "../../../../core/platform/services/database/api";
import UserServiceAPI, { CompaniesServiceAPI } from "../../api";
import { CompanyService } from "./service";
import { CounterAPI } from "../../../../core/platform/services/counter/types";
import { PlatformServicesAPI } from "../../../../core/platform/services/platform-services";

export function getService(
  platformServices: PlatformServicesAPI,
  service: UserServiceAPI,
): CompaniesServiceAPI {
  return new CompanyService(platformServices, service);
}

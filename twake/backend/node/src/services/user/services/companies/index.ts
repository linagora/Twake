import { DatabaseServiceAPI } from "../../../../core/platform/services/database/api";
import UserServiceAPI, { CompaniesServiceAPI } from "../../api";
import { CompanyService } from "./service";

export function getService(
  databaseService: DatabaseServiceAPI,
  userService: UserServiceAPI,
): CompaniesServiceAPI {
  return new CompanyService(databaseService, userService);
}

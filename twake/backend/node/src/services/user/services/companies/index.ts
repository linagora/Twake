import { DatabaseServiceAPI } from "../../../../core/platform/services/database/api";
import { CompaniesServiceAPI } from "../../api";
import { CompanyService } from "./service";

export function getService(databaseService: DatabaseServiceAPI): CompaniesServiceAPI {
  return new CompanyService(databaseService);
}

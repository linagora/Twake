import { DatabaseServiceAPI } from "../../../../core/platform/services/database/api";
import { CompaniesServiceAPI } from "../../api";
import { CompanyService } from "./service";
import { CounterProvider } from "../../../../core/platform/services/counter/provider";

export function getService(
  databaseService: DatabaseServiceAPI,
  counters: CounterProvider,
): CompaniesServiceAPI {
  return new CompanyService(databaseService, counters);
}

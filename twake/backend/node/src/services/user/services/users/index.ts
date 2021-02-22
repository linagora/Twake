import { DatabaseServiceAPI } from "../../../../core/platform/services/database/api";
import { UserService } from "./service";

export function getService(databaseService: DatabaseServiceAPI): UserService {
  return new UserService(databaseService);
}

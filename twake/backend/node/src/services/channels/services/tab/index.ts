
import { DatabaseServiceAPI } from "../../../../core/platform/services/database/api";
import { MemberService, TabService } from "../../provider";
import { Service } from "./service";

export function getService(databaseService: DatabaseServiceAPI, members: MemberService): TabService {
  return new Service(databaseService, members);
}

 
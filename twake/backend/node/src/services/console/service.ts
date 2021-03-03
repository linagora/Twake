import { Observable } from "rxjs";
import UserServiceAPI from "../user/api";
import { ConsoleServiceAPI } from "./api";
import { MergeProcess } from "./processing/merge";
import { CompanyCreatedStreamObject, UserCreatedStreamObject } from "./types";

class ConsoleService implements ConsoleServiceAPI {
  version: "1";

  constructor(private userService: UserServiceAPI) {}

  merge(
    baseUrl: string,
    concurrent: number = 1,
    dryRun: boolean = false,
  ): {
    companies$: Observable<CompanyCreatedStreamObject>;
    users$: Observable<UserCreatedStreamObject>;
  } {
    return new MergeProcess(this.userService, baseUrl, dryRun).getStreams(concurrent);
  }
}

export function getService(userService: UserServiceAPI): ConsoleServiceAPI {
  return new ConsoleService(userService);
}

import UserServiceAPI from "../user/api";
import { ConsoleServiceAPI } from "./api";
import { MergeProcess } from "./processing/merge";
import { MergeProgress } from "./types";

class ConsoleService implements ConsoleServiceAPI {
  version: "1";

  constructor(private userService: UserServiceAPI) {}

  merge(
    baseUrl: string,
    concurrent: number = 1,
    dryRun: boolean = false,
    console: string = "console",
    link: boolean = true,
    client: string,
    secret: string,
  ): MergeProgress {
    return new MergeProcess(this.userService, dryRun, console, link, {
      client,
      secret,
      url: baseUrl,
    }).merge(concurrent);
  }
}

export function getService(userService: UserServiceAPI): ConsoleServiceAPI {
  return new ConsoleService(userService);
}

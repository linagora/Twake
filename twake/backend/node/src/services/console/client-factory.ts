import { ConsoleRemoteClient } from "./clients/remote";
import { ConsoleServiceClient } from "./client-interface";
import { ConsoleClientParameters, ConsoleType } from "./types";
import { ConsoleInternalClient } from "./clients/internal";

class StaticConsoleClientFactory {
  create(
    type: ConsoleType,
    consoleParameters: ConsoleClientParameters,
    dryRun: boolean,
  ): ConsoleServiceClient {
    switch (type) {
      case "remote":
        return new ConsoleRemoteClient(consoleParameters, dryRun);
      case "internal":
        return new ConsoleInternalClient(consoleParameters, dryRun);
      default:
        throw new Error(`${type} is not supported`);
    }
  }
}

export const ConsoleClientFactory = new StaticConsoleClientFactory();

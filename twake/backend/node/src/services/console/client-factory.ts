import {
  CassandraConnectionOptions,
  CassandraConnector,
  ConnectionOptions,
  Connector,
  MongoConnectionOptions,
  MongoConnector,
} from "../../core/platform/services/database/services/orm/connectors";
import { ConsoleHTTPClient } from "./clients/http-client";
import { ConsoleServiceClient } from "./client-interface";
import { ConsoleClientParameters } from "./types";

declare type ConsoleType = "real" | "fake";

export class ClientFactory {
  public create(
    type: ConsoleType,
    consoleParameters: ConsoleClientParameters,
    dryRun = true,
  ): ConsoleServiceClient {
    switch (type) {
      case "real":
        return new ConsoleHTTPClient(consoleParameters, dryRun);
      case "fake":
        throw new Error(`Console type ${type} is not implemented yet`);
      default:
        throw new Error(`${type} is not supported`);
    }
  }
}

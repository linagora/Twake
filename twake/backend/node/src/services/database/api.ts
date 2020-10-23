import { TwakeServiceProvider } from "../../core/platform/framework";
import { Connector } from "./services/connectors";

export interface DatabaseServiceAPI extends TwakeServiceProvider {
  getConnector(): Connector;
}
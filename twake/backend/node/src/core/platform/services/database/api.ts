import { TwakeServiceProvider } from "../../framework";
import { Connector } from "./services/connectors";

export interface DatabaseServiceAPI extends TwakeServiceProvider {
  getConnector(): Connector;
}

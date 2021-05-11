import { TwakeServiceProvider } from "../../framework";
import { Connector } from "./services/connectors";

export interface SearchServiceAPI extends TwakeServiceProvider {
  /**
   * Get the search connector
   */
  getConnector(): Connector;
}

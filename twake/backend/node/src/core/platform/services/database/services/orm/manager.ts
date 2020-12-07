import { Connector } from "../connectors";

/**
 * Entity manager
 */
export default class Manager {
  constructor(readonly connector: Connector) {}

  public persist() {}

  public flush() {}
}

import { TwakeService } from "../../core/platform/framework";
import { DatabaseServiceAPI } from "./api";
import DatabaseService from "./services";
import { DatabaseType } from "./services";
import { ConnectionOptions } from "./services/connectors";

export default class Database extends TwakeService<DatabaseServiceAPI> {
  version = "1";
  name = "database";
  service: DatabaseService;

  public async doInit(): Promise<this> {
    const driver = this.configuration.get<DatabaseType>("type");

    if (!driver) {
      throw new Error("Database driver name must be specified in 'database.type' contfiguration");
    }

    const configuration: ConnectionOptions = this.configuration.get<ConnectionOptions>(driver);

    this.service = new DatabaseService(driver, configuration);
    await this.service.getConnector().connect();

    return this;
  }

  api(): DatabaseServiceAPI {
    return this.service;
  }
}

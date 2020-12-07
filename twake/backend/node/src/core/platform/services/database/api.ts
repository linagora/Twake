import { TwakeServiceProvider } from "../../framework";
import { Connector } from "./services/connectors";
import Manager from "./services/orm/manager";
import Repository, { RepositoryOptions } from "./services/orm/repository";

export interface DatabaseServiceAPI extends TwakeServiceProvider {
  getConnector(): Connector;
  newManager(): Manager;
  getRepository<Table>(table: string, options?: RepositoryOptions): Repository<Table>;
}

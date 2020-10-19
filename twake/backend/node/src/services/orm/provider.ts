import { TwakeServiceProvider } from "../../core/platform/framework";
import { ConnectionOptions, Connection, EntityManager } from "typeorm";

export default interface ORMServiceAPI extends TwakeServiceProvider {
  connect(options: ConnectionOptions): Promise<Connection>;

  readonly manager: EntityManager;
}

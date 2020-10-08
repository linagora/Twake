import { TwakeServiceProvider } from "../../core/platform/framework";
import { ConnectionOptions, Connection, Repository, EntityTarget, EntityManager } from "typeorm";

export default interface ORMServiceAPI extends TwakeServiceProvider {
  connect(options: ConnectionOptions): Promise<Connection>;

  registerEntity<Entity>(entity: EntityTarget<Entity>): Repository<Entity>;

  readonly manager: EntityManager;
}

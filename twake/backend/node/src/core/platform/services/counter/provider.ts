import { TwakeServiceProvider } from "../../framework";
import { CounterEntityHolder, CounterType, ICounterEntity } from "./types";
import Repository from "../database/services/orm/repository/repository";
import { DatabaseServiceAPI } from "../database/api";
import { merge } from "lodash";

export default interface CounterAPI extends TwakeServiceProvider {
  getCounter<T extends CounterProvider>(name: CounterType): T;
}

export class CounterProvider {
  protected readonly repository: Promise<Repository<ICounterEntity>>;
  private readonly entityInstance: ICounterEntity;

  constructor(database: DatabaseServiceAPI, counterEntityHolder: CounterEntityHolder) {
    this.repository = database.getRepository<ICounterEntity>(
      counterEntityHolder.TYPE,
      counterEntityHolder.entryTarget,
    );
    this.entityInstance = counterEntityHolder.entityInstance;
  }
  async increase(id: string, counterType: string, value: number): Promise<void> {
    return this.repository.then(r =>
      r.save(merge(this.entityInstance, { id, counterType, value })),
    );
  }
}

import { TwakeService } from "../../framework";
import { CounterProvider } from "./provider";
import { CounterAPI } from "./types";
import Repository from "../database/services/orm/repository/repository";
import { CounterEntity } from "../../../../utils/counter-entity";

export default class CounterService extends TwakeService<CounterAPI> implements CounterAPI {
  name = "counter";
  version = "1";

  api(): CounterAPI {
    return this;
  }

  async doInit(): Promise<this> {
    return Promise.resolve(this);
  }

  getCounter<T extends CounterEntity>(repository: Repository<T>): CounterProvider<T> {
    return new CounterProvider(repository);
  }
}

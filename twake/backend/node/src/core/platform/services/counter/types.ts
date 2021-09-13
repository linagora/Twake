import { TwakeServiceProvider } from "../../framework";
import Repository from "../database/services/orm/repository/repository";
import { CounterProvider } from "./provider";
import { CounterEntity } from "../../../../utils/counters";

export interface CounterAPI extends TwakeServiceProvider {
  getCounter<T extends CounterEntity>(repository: Repository<T>): CounterProvider<T>;
}

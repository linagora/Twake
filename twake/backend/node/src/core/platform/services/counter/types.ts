import { TwakeServiceProvider } from "../../framework";
import Repository from "../database/services/orm/repository/repository";
import { CounterProvider } from "./provider";

export interface CounterAPI extends TwakeServiceProvider {
  getCounter<T>(repository: Repository<T>): CounterProvider<T>;
}

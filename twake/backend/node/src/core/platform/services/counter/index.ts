import { Consumes, TwakeService } from "../../framework";
import CounterAPI, { CounterProvider } from "./provider";
import { DatabaseServiceAPI } from "../database/api";
import { CounterType } from "./types";

@Consumes(["database"])
export default class CounterService extends TwakeService<CounterAPI> implements CounterAPI {
  name = "counter";
  version = "1";
  private providers: Map<CounterType, CounterProvider> = new Map<CounterType, CounterProvider>();
  private database: DatabaseServiceAPI;

  api(): CounterAPI {
    return this;
  }

  async doInit(): Promise<this> {
    this.database = this.context.getProvider<DatabaseServiceAPI>("database");
    return Promise.all(
      Object.values(CounterType).map(counterType =>
        import("./entities/" + counterType).then((imp: any) => {
          this.providers.set(imp.default.TYPE, new CounterProvider(this.database, imp.default));
        }),
      ),
    ).then(() => this);
  }

  getCounter<T extends CounterProvider>(counterType: CounterType): T {
    return this.providers.get(counterType) as T;
  }

  // addCounterUpdater(): Promise<void> {
  //   return Promise.resolve(undefined);
  // }
}

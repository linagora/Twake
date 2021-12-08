import { IConfig } from "config";
import configuration from "../../config";
import { TwakeServiceConfiguration } from "./api";
export class Configuration implements TwakeServiceConfiguration {
  configuration: IConfig;
  serviceConfiguration: IConfig;

  constructor(path: string) {
    try {
      this.serviceConfiguration = configuration.get(path);
    } catch {
      // NOP
    }
  }

  get<T>(name?: string, defaultValue?: T): T {
    let value: T;

    try {
      value = this.serviceConfiguration as unknown as T;
      if (name) {
        value =
          this.serviceConfiguration &&
          (this.serviceConfiguration.get(name) || configuration.get(name));
      }
    } catch {
      value = defaultValue || null;
    } finally {
      return value;
    }
  }
}

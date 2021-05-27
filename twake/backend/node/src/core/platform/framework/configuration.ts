import { IConfig } from "config";
import configuration from "../../config";
import { TwakeServiceConfiguration } from "./api";
export class Configuration implements TwakeServiceConfiguration {
  configuration: IConfig;

  constructor(path: string) {
    try {
      this.configuration = configuration.get(path);
    } catch {
      // NOP
    }
  }

  get<T>(name?: string, defaultValue?: T): T {
    let value: T;

    try {
      value = (this.configuration as unknown) as T;
      if (name) {
        value = this.configuration && this.configuration.get(name);
      }
    } catch {
      value = defaultValue || null;
    } finally {
      return value;
    }
  }
}

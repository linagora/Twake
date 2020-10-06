import configuration from "../../config";
import { IConfig } from "config";

export interface TwakeServiceConfiguration {
  get<T>(name: string, defaultValue?: T): T;
}
export class Configuration implements TwakeServiceConfiguration {
  configuration: IConfig;

  constructor(path: string) {
    try {
      this.configuration = configuration.get(path);
    } catch {
      // NOP
    }
  }

  get<T>(name: string, defaultValue?: T): T {
    let value: T;

    try {
      value = this.configuration && this.configuration.get(name);
    } catch {
      value = defaultValue || null;
    } finally {
      return value;
    }
  }
}
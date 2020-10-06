import configuration from "../../config";
import { IConfig } from "config";

export interface TwakeServiceConfiguration {
  get<T>(name: string): T;
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

  get<T>(name: string): T {
    let value: T;

    try {
      value = this.configuration && this.configuration.get(name);
    } finally {
      return value;
    }
  }
}
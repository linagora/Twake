import { TwakeServiceConfiguration } from "./api";
import configuration from "../config";

export default class Configuration implements TwakeServiceConfiguration {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  configuration: any;

  // TODO: Give a configuration class so that this.configuration is typed.
  constructor(path: string) {
    this.configuration = configuration.get(path);
  }

  get<T>(name: string): T {
    return this.configuration.get(name);
  }
}
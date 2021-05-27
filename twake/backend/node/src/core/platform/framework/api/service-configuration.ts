export interface TwakeServiceConfiguration {
  get<T>(name?: string, defaultValue?: T): T;
}

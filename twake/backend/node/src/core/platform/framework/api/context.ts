import { TwakeServiceProvider } from "./service-provider";

export interface TwakeContext {
  getProvider<T extends TwakeServiceProvider>(name: string): T;
}

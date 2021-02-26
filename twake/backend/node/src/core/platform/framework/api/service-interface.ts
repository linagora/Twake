import { TwakeServiceProvider } from "./service-provider";

export interface TwakeServiceInterface<T extends TwakeServiceProvider> {
  doInit(): Promise<this>;
  doStart(): Promise<this>;
  doStop(): Promise<this>;
  api(): T;
}

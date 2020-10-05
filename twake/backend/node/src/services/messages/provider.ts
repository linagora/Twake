import { TwakeServiceProvider } from "../../core/platform/service";

export default interface MessageServiceAPI extends TwakeServiceProvider {
  // TODO
  send(): Promise<void>;
  receive(): Promise<void>
}

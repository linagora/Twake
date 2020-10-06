import { TwakeServiceProvider } from "../../core/platform/framework/api";

export default interface MessageServiceAPI extends TwakeServiceProvider {
  // TODO
  send(): Promise<void>;
  receive(): Promise<void>
}

import { TwakeServiceProvider } from "../../core/platform/api";

export default interface MessageServiceAPI extends TwakeServiceProvider {
  // TODO
  send(): Promise<void>;
  receive(): Promise<void>
}

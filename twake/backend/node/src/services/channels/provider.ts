import { TwakeServiceProvider } from "../../core/platform/framework/api";

export default interface ChannelServiceAPI extends TwakeServiceProvider {
  // TODO
  send(): Promise<void>;
  receive(): Promise<void>
}

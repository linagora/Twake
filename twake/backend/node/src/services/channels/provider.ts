import { TwakeServiceProvider } from "../../core/platform/framework/api";
import { Channel } from "./entities";

export default interface ChannelServiceAPI extends TwakeServiceProvider {
  list(): Promise<Channel[]>;

  getById(id: string): Promise<Channel>;

  create(channel: Channel): Promise<Channel>;
}

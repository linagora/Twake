import ORMServiceAPI from "../../orm/provider";
import { Channel } from "../entities";
import ChannelServiceAPI from "../provider";

// TODO: be able to inject the entity manager from the ORM service
export class ChannelService implements ChannelServiceAPI {
  version = "1";

  constructor(private orm: ORMServiceAPI) {}

  async list(): Promise<Channel[]> {
    const channels = await this.orm.manager.find<Channel>(Channel);

    return channels;
  }

  async getById(id: string): Promise<Channel> {
    const channel = await this.orm.manager.findOne<Channel>(Channel, id);

    return channel;
  }

  async create(channel: Channel): Promise<Channel> {
    return this.orm.manager.save(channel);
  }
}

import { Channel } from "../entities";
import ChannelServiceAPI from "../provider";
import { CreateChannelBody } from "./types";

export default class ChannelController {
  constructor(private service: ChannelServiceAPI<Channel>) {}

  async create(channel: CreateChannelBody): Promise<Channel> {
    const entity = new Channel();
    // TODO: Create the Channel entity from the CreateChannelBody
    // The CreateChannelBody is already validated by the web framework
    entity.name = channel.name;

    const result = await this.service.create(entity);

    return result.entity;
  }

  async getChannels(): Promise<Channel[]> {
    return this.service.list();
  }

  async getChannel(id: string): Promise<Channel | void> {
    return await this.service.get(id);
  }

  async remove(id: string): Promise<boolean> {
    const deleteResult = await this.service.delete(id);

    return deleteResult.deleted;
  }
}

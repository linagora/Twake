import { Channel } from "../entities";
import ChannelServiceAPI from "../provider";
import { CreateChannelBody } from "./types";


export default class ChannelController {
  constructor(private service: ChannelServiceAPI<Channel>) { }

  async create(channel: CreateChannelBody): Promise<Channel> {
    const entity = new Channel();
    // TODO: Create the Channel entity from the CreateChannelBody
    // The CreateChannelBody is already validated by the web framework

    entity.company_id = channel.company_id;
    entity.workspace_id = channel.workspace_id;
    entity.id = channel.id;
    entity.owner = channel.owner;
    entity.icon = channel.icon;
    entity.name = channel.name;
    entity.description = channel.description;
    entity.channel_group = channel.channel_group;
    entity.visibility = channel.visibility;
    entity.default = channel.default;
    entity.archived = channel.archived;
    entity.archivation_date = channel.archivation_date;


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

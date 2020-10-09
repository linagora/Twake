import fastify from "fastify";
import { Channel } from "../entities";
import ChannelServiceAPI from "../provider";
import { CreateChannelBody } from "./types";

export default class ChannelController {
  constructor(private service: ChannelServiceAPI) {}

  async create(channel: CreateChannelBody): Promise<Channel> {
    const entity = new Channel();
    entity.name = channel.name;

    const result = await this.service.create(entity);

    return result;
  }

  async getChannels(): Promise<Channel[]> {
    return this.service.list();
  }

  async getChannel(id: string): Promise<Channel | void> {
    return await this.service.getById(id);
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  async remove(id: string): Promise<void> {
    throw new Error("Not implemented");
  }
}

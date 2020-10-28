import { plainToClass } from "class-transformer";
import { Channel } from "../entities";
import ChannelServiceAPI from "../provider";
import { BaseChannelsParameters, ChannelListQueryParameters, ChannelParameters } from "./types";
import * as Types from "./typebox";

export default class ChannelController {
  constructor(private service: ChannelServiceAPI<Channel>) {}

  async create(params: Types.ChannelsRouteParameters, channel: Types.CreateChannelBody): Promise<Channel> {
    const entity = plainToClass(Channel, {
      ...channel,
      ...{
        company_id: params.company_id,
        workspace_id: params.workspace_id
      }
    });

    const result = await this.service.create(entity);

    return result.entity;
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  async getChannels(params: BaseChannelsParameters, query: ChannelListQueryParameters): Promise<Channel[]> {
    return this.service.list();
  }

  async getChannel(params: ChannelParameters): Promise<Channel | void> {
    return await this.service.get(params.id);
  }

  async remove(params: ChannelParameters): Promise<boolean> {
    const deleteResult = await this.service.delete(params.id);

    return deleteResult.deleted;
  }
}

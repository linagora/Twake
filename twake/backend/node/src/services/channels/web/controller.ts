import { plainToClass } from "class-transformer";
import { Channel } from "../entities";
import ChannelServiceAPI from "../provider";
import { BaseChannelsParameters, ChannelListQueryParameters, ChannelParameters, CreateChannelBody } from "./types";


export default class ChannelController {
  constructor(private db: ChannelServiceAPI<Channel>) { }

  async save(params: ChannelParameters, channel: CreateChannelBody): Promise<Channel> {

    //get existing channel if params.id is defined
    if (params.id) {
      this.getChannel(params);
    }
    //get existing channel archived status

    //If archived: you can't change anything

    const entity = plainToClass(Channel, {
      ...channel,
      ...{
        company_id: params.company_id,
        workspace_id: params.workspace_id,
        id: params.id
      },
    });

    const result = await this.db.save(entity);
    return result.entity;
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  async getChannels(params: BaseChannelsParameters, query: ChannelListQueryParameters): Promise<Channel[]> {
    return this.db.list({
      company_id: params.company_id,
      workspace_id: params.workspace_id,
    });
  }

  async getChannel(params: ChannelParameters): Promise<Channel | void> {

    return await this.db.get({
      id: params.id,
      company_id: params.company_id,
      workspace_id: params.workspace_id,
    });
  }

  async remove(params: ChannelParameters): Promise<boolean> {
    const deleteResult = await this.db.delete({
      id: params.id,
      company_id: params.company_id,
      workspace_id: params.workspace_id,
    });
    return deleteResult.deleted;
  }
}

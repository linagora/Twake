/* eslint-disable @typescript-eslint/no-unused-vars */
import cassandra from "cassandra-driver";
import { Channel } from "../entities";
import ChannelServiceAPI from "../provider";
import { RealtimeDeleted, RealtimeCreated, RealtimeUpdated } from "../../../core/platform/framework/decorators";
import { UpdateResult, CreateResult, DeleteResult } from "../../../core/platform/framework/api/crud-service";


export class CassandraChannelService implements ChannelServiceAPI<Channel> {
  version = "1";



  constructor(private client: cassandra.Client) { }


  @RealtimeCreated<Channel>("/channels", channel => `/channels/${channel.id}`)
  async create(channel: Channel): Promise<CreateResult<Channel>> {
    //const entity = await this.orm.manager.save(channel);


    //save in DB
    const query = 'INSERT INTO twakechannel.channel_data ("company_id", "workspace_id", "id", "owner", "icon", "name", "description", "channel_group", "visibility", "defaut", "archived", "archivation_date") VALUES (?,?,?,?,?,?,?,?,?,?,?,?)';
    const params = [channel.company_id, channel.workspace_id, channel.id, channel.owner, channel.icon, channel.name, channel.description, channel.channel_group, channel.visibility, channel.default, channel.archived, channel.archivation_date];
    await this.client.execute(query, params);

    //return what we just saved
    const result = new CreateResult<Channel>('channel', channel);
    return result

    //throw new Error("Not implemented");
  }

  get(id: string): Promise<Channel> {
    throw new Error("Not implemented get");
  }

  @RealtimeUpdated<string>("/channels", id => `/channels/${id}`)
  async update(id: string, entity: Channel): Promise<UpdateResult<Channel>> {
    throw new Error("Not implemented update ");
  }

  @RealtimeDeleted<Channel>("/channels", channel => `/channels/${channel.id}`)
  async delete(id: string): Promise<DeleteResult<Channel>> {
    throw new Error("Not implemented delete");
  }

  async list(/*TO DO*/): Promise<Channel[]> {
    throw new Error("Not implemented list");
  }
}

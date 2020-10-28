/* eslint-disable @typescript-eslint/no-unused-vars */
import cassandra from "cassandra-driver";
import { Channel } from "../entities";
import ChannelServiceAPI from "../provider";
import { RealtimeDeleted, RealtimeSaved } from "../../../core/platform/framework/decorators";
import { SaveResult, DeleteResult } from "../../../core/platform/framework/api/crud-service";
import { resolve } from "path";


export class CassandraChannelService implements ChannelServiceAPI<Channel> {
  version = "1";

  constructor(private client: cassandra.Client) { }


  @RealtimeSaved<Channel>("/channels", channel => `/channels/${channel.id}`)
  async save(channel: Channel): Promise<SaveResult<Channel>> {

    //save in DB
    const query = 'INSERT INTO twakechannel.channel_data ("company_id", "workspace_id", "id", "icon", "name", "description", "channel_group", "visibility", "defaut", "archived") VALUES (?,?,?,?,?,?,?,?,?,?)';
    const params = [channel.company_id, channel.workspace_id, channel.id, channel.icon, channel.name, channel.description, channel.channel_group, channel.visibility, channel.default, channel.archived];
    await this.client.execute(query, params);

    //return what we just saved
    const result = new SaveResult<Channel>('channel', channel);
    return result


    //throw new Error("Not implemented");
  }

  async get(pk: { [column: string]: string | number }): Promise<Channel> {
    const query = 'SELECT * FROM twakechannel.channel_data WHERE id = ? AND company_id = ? AND workspace_id = ? ';
    const params = [pk.id, pk.company_id, pk.workspace_id];
    const result = new Channel();

    await this.client.execute(query, params)
      .then(results => {
        const row = results.first();
        result.company_id = row.values()[0];
        result.workspace_id = row.values()[1];
        result.id = row.values()[2];
        result.owner = row.values()[10];
        result.icon = row.values()[8];
        result.name = row.values()[9];
        result.description = row.values()[7];
        result.channel_group = row.values()[5];
        result.visibility = row.values()[11];
        result.default = row.values()[6];
        result.archived = row.values()[4];
        result.archivation_date = row.values()[3];
      });
    return result;

  }

  @RealtimeDeleted<Channel>("/channels", channel => `/channels/${channel.id}`)
  async delete(pk: { [column: string]: string | number }): Promise<DeleteResult<Channel>> {
    const channelToDelete = await this.get(pk);
    const query = 'DELETE FROM twakechannel.channel_data WHERE id = ? AND company_id = ? AND workspace_id = ? ';
    const params = [pk.id, pk.company_id, pk.workspace_id];
    await this.client.execute(query, params);

    const result = new DeleteResult<Channel>('channel', channelToDelete, true);
    return result;
  }

  async list(pk: { [column: string]: string | number }/*TO DO*/): Promise<Channel[]> {
    const query = 'SELECT * FROM twakechannel.channel_data WHERE company_id = ? AND workspace_id = ?';
    const params = [pk.company_id, pk.workspace_id];
    let resultArray: Channel[] = [];

    await this.client.execute(query, params)
      .then(results => {
        resultArray = results.rows.map((row) => {
          const result = new Channel();
          result.company_id = row.values()[0];
          result.workspace_id = row.values()[1];
          result.id = row.values()[2];
          result.owner = row.values()[10];
          result.icon = row.values()[8];
          result.name = row.values()[9];
          result.description = row.values()[7];
          result.channel_group = row.values()[5];
          result.visibility = row.values()[11];
          result.default = row.values()[6];
          result.archived = row.values()[4];
          result.archivation_date = row.values()[3];
          return result;
        });
      });
    //TO DO => feed result 
    console.log("channel[]", resultArray);

    return resultArray;
    //throw new Error("Not implemented list");
  }
}

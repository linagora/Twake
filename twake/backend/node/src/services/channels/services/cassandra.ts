/* eslint-disable @typescript-eslint/no-unused-vars */
import cassandra, { types } from "cassandra-driver";
import { Channel } from "../entities";
import ChannelServiceAPI from "../provider";
import { RealtimeDeleted, RealtimeSaved } from "../../../core/platform/framework/decorators";
import { SaveResult, DeleteResult } from "../../../core/platform/framework/api/crud-service";
import { resolve } from "path";
import Uuid from "cassandra-driver"


export class CassandraChannelService implements ChannelServiceAPI<Channel> {
  version = "1";

  constructor(private client: cassandra.Client) { }


  @RealtimeSaved<Channel>("/channels", channel => `/channels/${channel.id}`)
  async save(channel: Channel): Promise<SaveResult<Channel>> {
    const channelID_uuidv4 = Uuid.types.Uuid.random();
    let params;

    //save in DB
    const query = 'INSERT INTO twakechannel.channel_test ("company_id", "workspace_id", "id", "icon", "name", "description", "channel_group", "visibility", "is_default", "archived") VALUES (?,?,?,?,?,?,?,?,?,?)';
    //console.log("IDIDIDIDI=", channel.id, "=alors");
    if (!channel.id) {
      channel.id = String(channelID_uuidv4);
    }
    params = [channel.company_id, channel.workspace_id, channel.id, channel.icon, channel.name, channel.description, channel.channel_group, channel.visibility, channel.is_default, channel.archived];

    //console.log(channel, "type of is default", typeof (channel.is_default), "type of archived", typeof (channel.archived));
    await this.client.execute(query, params);

    //return what we just saved
    const result = new SaveResult<Channel>('channel', channel);
    return result
    //throw new Error("Not implemented");
  }

  async get(pk: { [column: string]: string | number }): Promise<Channel | null> {
    const query = 'SELECT * FROM twakechannel.channel_test WHERE id = ? AND company_id = ? AND workspace_id = ? ';

    const result = new Channel();

    await this.client.execute(query, [pk.id, pk.company_id, pk.workspace_id])
      .then(results => {
        const row = results.first();
        if (results.rowLength == 0) { return null };
        result.company_id = row.values()[0];
        result.workspace_id = row.values()[1];
        result.id = row.values()[2];
        result.owner = row.values()[10];
        result.icon = row.values()[8];
        result.name = row.values()[9];
        result.description = row.values()[7];
        result.channel_group = row.values()[5];
        result.visibility = row.values()[11];
        result.is_default = row.values()[6];
        result.archived = row.values()[4];
        result.archivation_date = row.values()[3];
      });
    return result;
  }

  @RealtimeDeleted<Channel>("/channels", channel => `/channels/${channel.id}`)
  async delete(pk: { [column: string]: string | number }): Promise<DeleteResult<Channel>> {
    const channelToDelete = await this.get(pk);
    const query = 'DELETE FROM twakechannel.channel_test WHERE id = ? AND company_id = ? AND workspace_id = ?';
    //const params = [pk.id, pk.company_id, pk.workspace_id];
    await this.client.execute(query, [pk.id, pk.company_id, pk.workspace_id]);

    return (new DeleteResult<Channel>('channel', channelToDelete, true))
    //return result;
  }

  async list(pk: { [column: string]: string | number }/*TO DO*/): Promise<Channel[]> {
    const query = 'SELECT * FROM twakechannel.channel_test WHERE company_id = ? AND workspace_id = ?';
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
          result.is_default = row.values()[6];
          result.archived = row.values()[4];
          result.archivation_date = row.values()[3];
          return result;
        });
      });

    return resultArray;
    //throw new Error("Not implemented list");
  }
}

/* eslint-disable @typescript-eslint/no-unused-vars */
import cassandra from "cassandra-driver";
import { Channel } from "../entities";
import ChannelServiceAPI from "../provider";
import { RealtimeDeleted, RealtimeSaved } from "../../../core/platform/framework/decorators";
import { SaveResult, DeleteResult } from "../../../core/platform/framework/api/crud-service";
import Uuid from "cassandra-driver"


export class CassandraChannelService implements ChannelServiceAPI<Channel> {
  version = "1";

  constructor(private client: cassandra.Client) { }


  @RealtimeSaved<Channel>("/channels", channel => `/channels/${channel.id}`)
  async save(channel: Channel): Promise<SaveResult<Channel>> {
    //generate a new ID when crating a channel
    const channelID_uuidv4 = Uuid.types.Uuid.random();

    //save in DB
    const query = 'INSERT INTO twakechannel.channel_test ("company_id", "workspace_id", "id", "icon", "name", "description", "channel_group", "visibility", "is_default", "archived") VALUES (?,?,?,?,?,?,?,?,?,?)';
    if (!channel.id) {
      channel.id = String(channelID_uuidv4);
    }
    const params = [channel.company_id, channel.workspace_id, channel.id, channel.icon, channel.name, channel.description, channel.channel_group, channel.visibility, channel.is_default, channel.archived];
    await this.client.execute(query, params);

    //return what we just saved
    return (new SaveResult<Channel>('channel', channel));
  }

  async get(pk: { [column: string]: string | number }): Promise<Channel | null> {
    //get a channel in DB
    const query = 'SELECT * FROM twakechannel.channel_test WHERE id = ? AND company_id = ? AND workspace_id = ? ';
    const result = new Channel();
    const row = (await this.client.execute(query, [pk.id, pk.company_id, pk.workspace_id])).first();

    //return the channel
    this.feedChannel(result, row);
    return result

  }

  @RealtimeDeleted<Channel>("/channels", channel => `/channels/${channel.id}`)
  async delete(pk: { [column: string]: string | number }): Promise<DeleteResult<Channel>> {
    //get the channel to delete
    const channelToDelete = await this.get(pk);

    //delete in DB
    const query = 'DELETE FROM twakechannel.channel_test WHERE id = ? AND company_id = ? AND workspace_id = ?';
    await this.client.execute(query, [pk.id, pk.company_id, pk.workspace_id]);

    return (new DeleteResult<Channel>('channel', channelToDelete, true)) //TO-DO return boolean confirminf deleting 

  }

  async list(pk: { [column: string]: string | number }/*TO DO*/): Promise<Channel[]> {
    const query = 'SELECT * FROM twakechannel.channel_test WHERE company_id = ? AND workspace_id = ?';
    const params = [pk.company_id, pk.workspace_id];
    let resultArray: Channel[] = [];

    await this.client.execute(query, params)
      .then(results => {
        resultArray = results.rows.map((row) => {
          const result = new Channel();
          this.feedChannel(result, row);
          return result
        });
      });
    return resultArray;
  }

  //this method fatorize cod for get and getAll
  async feedChannel(result: Channel, row: cassandra.types.Row): Promise<Channel> {
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
    return result
  }
}

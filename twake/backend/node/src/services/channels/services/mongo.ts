import * as mongo from "mongodb";
import { Channel } from "../entities";
import ChannelServiceAPI from "../provider";
import { RealtimeDeleted, RealtimeSaved } from "../../../core/platform/framework/decorators";
import { SaveResult, DeleteResult } from "../../../core/platform/framework/api/crud-service";
import { getChannelPath } from "../realtime";

export class MongoChannelService implements ChannelServiceAPI<Channel> {
  version = "1";
  private collection: mongo.Collection<Channel>;

  constructor(private db: mongo.Db) {
    this.collection = this.db.collection<Channel>("channels");
  }

  @RealtimeSaved<Channel>("/channels", channel => getChannelPath(channel))
  async save(channel: Channel): Promise<SaveResult<Channel>> {
    const result = await this.collection.insertOne(channel, { w: 1 });

    if (result.insertedCount) {
      const created: Channel = result.ops[0];
      created.id = String(created._id);

      return new SaveResult<Channel>("channel", created);
    } else {
      throw new Error("Channel has not been created");
    }
  }

  async get(pk: { [column: string]: string | number }): Promise<Channel> {
    const channel = await this.collection.findOne<Channel>({ _id: new mongo.ObjectID(pk.id) });

    // TODO: Automate this: a decorator with class-transformer will be nice
    if (channel) {
      channel.id = String(channel._id);
    }
    return channel;
  }

  @RealtimeDeleted<Channel>("/channels", channel => getChannelPath(channel))
  async delete(pk: { [column: string]: string | number }): Promise<DeleteResult<Channel>> {
    const deleteResult = await this.collection.deleteOne({ _id: new mongo.ObjectID(pk.id) });

    return new DeleteResult<Channel>("channel", { id: pk.id } as Channel, deleteResult.deletedCount === 1);
  }

  async list(/* TODO: Options */): Promise<Channel[]> {
    return this.collection.find().map(document => ({ ...document, ...{ id: String(document._id) } })).toArray();
  }
}

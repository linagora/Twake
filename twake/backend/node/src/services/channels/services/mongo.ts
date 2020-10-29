import * as mongo from "mongodb";
import { Channel } from "../entities";
import ChannelServiceAPI from "../provider";
import { RealtimeDeleted, RealtimeCreated, RealtimeUpdated } from "../../../core/platform/framework/decorators";
import { UpdateResult, CreateResult, DeleteResult } from "../../../core/platform/framework/api/crud-service";
import { getChannelPath } from "../realtime";

export class MongoChannelService implements ChannelServiceAPI {
  version = "1";
  private collection: mongo.Collection<Channel>;

  constructor(private db: mongo.Db) {
    this.collection = this.db.collection<Channel>("channels");
  }

  @RealtimeCreated<Channel>("/channels", channel => getChannelPath(channel))
  async create(channel: Channel): Promise<CreateResult<Channel>> {
    const result = await this.collection.insertOne(channel, { w:1 });

    if (result.insertedCount) {
      const created: Channel = result.ops[0];
      created.id = String(created._id);

      return new CreateResult<Channel>("channel", created);
    } else {
      throw new Error("Channel has not been created");
    }
  }

  async get(id: string): Promise<Channel> {
    const channel = await this.collection.findOne<Channel>({ _id: new mongo.ObjectID(id) });

    // TODO: Automate this: a decorator with class-transformer will be nice
    if (channel) {
      channel.id = String(channel._id);
    }
    return channel;
  }

  @RealtimeUpdated<Channel>("/channels", channel => getChannelPath(channel))
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  async update(id: string, entity: Channel): Promise<UpdateResult<Channel>> {
    // TODO
    return null;
  }

  @RealtimeDeleted<Channel>("/channels", channel => getChannelPath(channel))
  async delete(id: string): Promise<DeleteResult<Channel>> {
    const deleteResult = await this.collection.deleteOne({ _id: new mongo.ObjectID(id)});

    return new DeleteResult<Channel>("channel", { id } as Channel, deleteResult.deletedCount === 1);
  }

  async list(/* TODO: Options */): Promise<Channel[]> {
    return this.collection.find().map(document => ({...document, ...{id: String(document._id)}})).toArray();
  }
}

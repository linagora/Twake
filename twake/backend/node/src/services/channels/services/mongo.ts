import * as mongo from "mongodb";
import { v4 as uuidv4 } from "uuid";
import { Channel } from "../entities";
import ChannelServiceAPI, { ChannelPrimaryKey } from "../provider";
import { MongoPagination } from "../../../core/platform/services/database/services/connectors/mongodb";
import {
  CreateResult,
  DeleteResult,
  Pagination,
  ListResult,
  OperationType,
  SaveResult,
  UpdateResult,
} from "../../../core/platform/framework/api/crud-service";
import { WorkspaceExecutionContext } from "../types";

export class MongoChannelService implements ChannelServiceAPI {
  version = "1";
  private collection: mongo.Collection<Channel>;

  constructor(private db: mongo.Db) {
    this.collection = this.db.collection<Channel>("channels");
  }

  async save(channel: Channel, context: WorkspaceExecutionContext): Promise<SaveResult<Channel>> {
    const mode = channel.id ? OperationType.UPDATE : OperationType.CREATE;
    let result: SaveResult<Channel>;

    if (mode === OperationType.CREATE) {
      const created = await this.create(channel, context);

      result = new SaveResult<Channel>("channel", created.entity, mode);
    } else if (mode === OperationType.UPDATE) {
      const updated = await this.update({ id: String(channel.id) }, channel);

      result = new SaveResult<Channel>("channel", updated.entity, mode);
    } else {
      throw new Error("Can not define operation to apply to channel");
    }

    return result;
  }

  async create(
    channel: Channel,
    context: WorkspaceExecutionContext,
  ): Promise<CreateResult<Channel>> {
    channel.owner = context?.user.id;
    channel.id = uuidv4();

    const inserted = await this.collection.insertOne(channel, { w: 1 });

    if (!inserted.insertedCount) {
      throw new Error("No channel created");
    }

    const createdChannel: Channel = inserted.ops[0];

    return new CreateResult<Channel>("channel", createdChannel);
  }

  async update(pk: ChannelPrimaryKey, channel: Channel): Promise<UpdateResult<Channel>> {
    const updated = await this.collection.updateOne({ id: pk.id }, { $set: channel });

    const result = new UpdateResult<Channel>("channel", channel);
    result.affected = updated.modifiedCount;

    return result;
  }

  async get(pk: ChannelPrimaryKey): Promise<Channel> {
    return await this.collection.findOne<Channel>({ id: pk.id });
  }

  async delete(pk: ChannelPrimaryKey): Promise<DeleteResult<Channel>> {
    const deleteResult = await this.collection.deleteOne({ id: pk.id });

    return new DeleteResult<Channel>(
      "channel",
      { id: pk.id } as Channel,
      deleteResult.deletedCount === 1,
    );
  }

  async list(pagination: Pagination): Promise<ListResult<Channel>> {
    const paginate = MongoPagination.from(pagination);

    const channels = await this.collection
      .find()
      .skip(paginate.skip)
      .limit(paginate.limit)
      .toArray();

    return new ListResult("channel", channels, MongoPagination.next(paginate, channels));
  }
}

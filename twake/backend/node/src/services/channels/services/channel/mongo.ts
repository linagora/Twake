import * as mongo from "mongodb";
import { v4 as uuidv4 } from "uuid";
import { Channel } from "../../entities";
import { ChannelService, ChannelPrimaryKey } from "../../provider";
import {
  MongoConnector,
  MongoPagination,
} from "../../../../core/platform/services/database/services/orm/connectors/mongodb/mongodb";
import {
  CreateResult,
  DeleteResult,
  Pagination,
  ListResult,
  OperationType,
  SaveResult,
  UpdateResult,
} from "../../../../core/platform/framework/api/crud-service";
import { WorkspaceExecutionContext } from "../../types";
import { DirectChannel } from "../../entities/direct-channel";
import { ChannelSaveOptions } from "../../web/types";

const TYPE = "channel";

export class MongoChannelService implements ChannelService {
  version = "1";
  private collection: mongo.Collection<Channel>;

  constructor(private connector: MongoConnector) {}

  async init(): Promise<this> {
    const db = await this.connector.getDatabase();

    this.collection = db.collection<Channel>(`${TYPE}s`);

    return this;
  }

  async save(
    channel: Channel,
    options: ChannelSaveOptions,
    context: WorkspaceExecutionContext,
  ): Promise<SaveResult<Channel>> {
    const mode = channel.id ? OperationType.UPDATE : OperationType.CREATE;
    let result: SaveResult<Channel>;

    if (mode === OperationType.CREATE) {
      const created = await this.create(channel, context);

      result = new SaveResult<Channel>(TYPE, created.entity, mode);
    } else if (mode === OperationType.UPDATE) {
      const updated = await this.update({ id: String(channel.id) }, channel);

      result = new SaveResult<Channel>(TYPE, updated.entity, mode);
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

    return new CreateResult<Channel>(TYPE, createdChannel);
  }

  async update(pk: ChannelPrimaryKey, channel: Channel): Promise<UpdateResult<Channel>> {
    const updated = await this.collection.updateOne({ id: pk.id }, { $set: channel });

    const result = new UpdateResult<Channel>(TYPE, channel);
    result.affected = updated.modifiedCount;

    return result;
  }

  async get(pk: ChannelPrimaryKey): Promise<Channel> {
    return await this.collection.findOne<Channel>({ id: pk.id }, null);
  }

  async delete(pk: ChannelPrimaryKey): Promise<DeleteResult<Channel>> {
    const deleteResult = await this.collection.deleteOne({ id: pk.id });

    return new DeleteResult<Channel>(
      TYPE,
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

    return new ListResult(TYPE, channels, MongoPagination.next(paginate, channels));
  }

  markAsRead(): Promise<boolean> {
    throw new Error("Not implemented");
  }

  markAsUnread(): Promise<boolean> {
    throw new Error("Not implemented");
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  createDirectChannel(directChannel: DirectChannel): Promise<DirectChannel> {
    throw new Error("Not implemented");
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  getDirectChannel(directChannel: DirectChannel): Promise<DirectChannel> {
    throw new Error("Not implemented");
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  getDirectChannelInCompany(companyId: string, users: string[]): Promise<DirectChannel> {
    throw new Error("Not implemented");
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  getDirectChannelsForUsersInCompany(companyId: string, userId: string): Promise<DirectChannel[]> {
    throw new Error("Not implemented");
  }

  listDirectChannels(): Promise<DirectChannel[]> {
    throw new Error("Not implemented");
  }
}

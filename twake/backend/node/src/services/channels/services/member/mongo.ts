import * as mongo from "mongodb";
import { Channel, ChannelMember } from "../../entities";
import { MemberService, ChannelPrimaryKey } from "../../provider";
import { MongoPagination } from "../../../../core/platform/services/database/services/connectors/mongodb";
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

const TYPE = "channel_member";

export class MongoMemberService implements MemberService {
  version = "1";
  private collection: mongo.Collection<ChannelMember>;

  constructor(private db: mongo.Db) {
    this.collection = this.db.collection<ChannelMember>(`${TYPE}s`);
  }

  async save(
    channel: ChannelMember,
    context: WorkspaceExecutionContext,
  ): Promise<SaveResult<ChannelMember>> {
    const mode = channel.id ? OperationType.UPDATE : OperationType.CREATE;
    let result: SaveResult<ChannelMember>;

    if (mode === OperationType.CREATE) {
      const created = await this.create(channel, context);

      result = new SaveResult<ChannelMember>(TYPE, created.entity, mode);
    } else if (mode === OperationType.UPDATE) {
      const updated = await this.update({ id: String(channel.id) }, channel);

      result = new SaveResult<ChannelMember>(TYPE, updated.entity, mode);
    } else {
      throw new Error("Can not define operation to apply to channel member");
    }

    return result;
  }

  async create(
    member: ChannelMember,
    context: WorkspaceExecutionContext,
  ): Promise<CreateResult<ChannelMember>> {
    // TODO

    const inserted = await this.collection.insertOne(member, { w: 1 });

    if (!inserted.insertedCount) {
      throw new Error("No channel member created");
    }

    const created: ChannelMember = inserted.ops[0];

    return new CreateResult<ChannelMember>(TYPE, created);
  }

  update(pk: ChannelPrimaryKey, member: ChannelMember): Promise<UpdateResult<ChannelMember>> {
    throw new Error("FU");
  }

  async get(pk: ChannelPrimaryKey): Promise<ChannelMember> {
    return await this.collection.findOne<ChannelMember>({ id: pk.id });
  }

  async delete(pk: ChannelPrimaryKey): Promise<DeleteResult<ChannelMember>> {
    const deleteResult = await this.collection.deleteOne({ id: pk.id });

    return new DeleteResult<ChannelMember>(
      "channel",
      { id: pk.id } as Channel,
      deleteResult.deletedCount === 1,
    );
  }

  async list(pagination: Pagination): Promise<ListResult<ChannelMember>> {
    const paginate = MongoPagination.from(pagination);

    const members = await this.collection
      .find()
      .skip(paginate.skip)
      .limit(paginate.limit)
      .toArray();

    return new ListResult(TYPE, members, MongoPagination.next(paginate, members));
  }
}

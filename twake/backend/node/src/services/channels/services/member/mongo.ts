import * as mongo from "mongodb";
import { ChannelMember, ChannelMemberPrimaryKey } from "../../entities";
import { MemberService } from "../../provider";
import {
  MongoConnector,
  MongoPagination,
} from "../../../../core/platform/services/database/services/orm/connectors/mongodb/mongodb";
import {
  CreateResult,
  DeleteResult,
  Pagination,
  ListResult,
  SaveResult,
  UpdateResult,
  OperationType,
} from "../../../../core/platform/framework/api/crud-service";
import { ChannelExecutionContext } from "../../types";
import { ChannelMemberSaveOptions } from "../../web/types";

const TYPE = "channel_member";

export class MongoMemberService implements MemberService {
  version = "1";
  private collection: mongo.Collection<ChannelMember>;

  constructor(private connector: MongoConnector) {}

  async init(): Promise<this> {
    const db = await this.connector.getDatabase();
    this.collection = db.collection<ChannelMember>(`${TYPE}s`);

    return this;
  }

  async save(
    member: ChannelMember,
    options: ChannelMemberSaveOptions,
    context: ChannelExecutionContext,
  ): Promise<SaveResult<ChannelMember>> {
    // TODO: Switch create or update
    const createResult = await this.create(member, context);

    return new SaveResult<ChannelMember>(TYPE, createResult.entity, OperationType.CREATE);
  }

  async create(
    member: ChannelMember,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    context: ChannelExecutionContext,
  ): Promise<CreateResult<ChannelMember>> {
    // TODO assert required and default fields are set
    const inserted = await this.collection.insertOne(member, { w: 1 });

    if (!inserted.insertedCount) {
      throw new Error("No channel member created");
    }

    return new CreateResult<ChannelMember>(TYPE, inserted.ops[0]);
  }

  async update(
    pk: ChannelMemberPrimaryKey,
    member: ChannelMember,
  ): Promise<UpdateResult<ChannelMember>> {
    const updated = await this.collection.updateOne(pk, { $set: member });

    const result = new UpdateResult<ChannelMember>(TYPE, member);
    result.affected = updated.modifiedCount;

    return result;
  }

  async get(pk: ChannelMemberPrimaryKey): Promise<ChannelMember> {
    // TODO: Assert required fields are set
    return this.collection.findOne<ChannelMember>(pk, null);
  }

  async delete(pk: ChannelMemberPrimaryKey): Promise<DeleteResult<ChannelMember>> {
    const deleteResult = await this.collection.deleteOne(pk);

    return new DeleteResult<ChannelMember>(
      TYPE,
      pk as ChannelMember,
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

  listUserChannels(): Promise<ListResult<ChannelMember>> {
    throw new Error("Not implemented");
  }

  isChannelMember(): Promise<ChannelMember> {
    throw new Error("Not implemented");
  }
}

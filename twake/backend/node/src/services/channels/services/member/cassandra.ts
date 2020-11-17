import cassandra from "cassandra-driver";
import {
  CreateResult,
  UpdateResult,
  SaveResult,
  DeleteResult,
  Paginable,
  ListResult,
} from "../../../../core/platform/framework/api/crud-service";
import { CassandraConnectionOptions } from "../../../../core/platform/services/database/services/connectors";
import { ChannelMember } from "../../entities";
import { MemberService, ChannelPrimaryKey } from "../../provider";
import { WorkspaceExecutionContext } from "../../types";

export class CassandraMemberService implements MemberService {
  version: "1";

  constructor(private client: cassandra.Client, private options: CassandraConnectionOptions) {}

  init?(): Promise<this> {
    throw new Error("Method not implemented.");
  }
  create?(
    item: ChannelMember,
    context?: WorkspaceExecutionContext,
  ): Promise<CreateResult<ChannelMember>> {
    throw new Error("Method not implemented.");
  }
  get(pk: ChannelPrimaryKey, context?: WorkspaceExecutionContext): Promise<ChannelMember> {
    throw new Error("Method not implemented.");
  }
  update?(
    pk: ChannelPrimaryKey,
    item: ChannelMember,
    context?: WorkspaceExecutionContext,
  ): Promise<UpdateResult<ChannelMember>> {
    throw new Error("Method not implemented.");
  }
  save?(
    item: ChannelMember,
    context: WorkspaceExecutionContext,
  ): Promise<SaveResult<ChannelMember>> {
    throw new Error("Method not implemented.");
  }
  delete(
    pk: ChannelPrimaryKey,
    context?: WorkspaceExecutionContext,
  ): Promise<DeleteResult<ChannelMember>> {
    throw new Error("Method not implemented.");
  }
  list(
    pagination: Paginable,
    context?: WorkspaceExecutionContext,
  ): Promise<ListResult<ChannelMember>> {
    throw new Error("Method not implemented.");
  }
}

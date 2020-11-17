import {
  RealtimeSaved,
  RealtimeUpdated,
  RealtimeDeleted,
} from "../../../../core/platform/framework";
import {
  UpdateResult,
  DeleteResult,
  Pagination,
  ListResult,
  SaveResult,
  CrudExeption,
} from "../../../../core/platform/framework/api/crud-service";
import { ChannelPrimaryKey, MemberService } from "../../provider";

import { ChannelMember } from "../../entities";
import { WorkspaceExecutionContext } from "../../types";
import { isWorkspaceAdmin as userIsWorkspaceAdmin } from "../../../../utils/workspace";
import { Channel } from "../../../../services/types";
import { pick } from "../../../../utils/pick";

export class Service implements MemberService {
  version: "1";

  constructor(private service: MemberService) {}

  async init(): Promise<this> {
    try {
      this.service.init && (await this.service.init());
    } catch (err) {
      console.error("Can not initialize channel member service");
    }

    return this;
  }

  @RealtimeSaved<ChannelMember>(() => "/todo", () => "/todo")
  async save(
    member: ChannelMember,
    context: WorkspaceExecutionContext,
  ): Promise<SaveResult<ChannelMember>> {
    throw new Error("Not implemented");
  }

  get(pk: ChannelPrimaryKey, context: WorkspaceExecutionContext): Promise<ChannelMember> {
    return this.service.get(pk, context);
  }

  @RealtimeUpdated<ChannelMember>(() => "/todo", () => "/todo")
  update(
    pk: ChannelPrimaryKey,
    channel: ChannelMember,
    context: WorkspaceExecutionContext,
  ): Promise<UpdateResult<ChannelMember>> {
    return this.service.update(pk, channel, context);
  }

  @RealtimeDeleted<ChannelMember>(() => "/todo", () => "/todo")
  async delete(
    pk: ChannelPrimaryKey,
    context: WorkspaceExecutionContext,
  ): Promise<DeleteResult<ChannelMember>> {
    let channel: Channel; // TODO;
    const memberToDelete = await this.get(this.getPrimaryKey(pk), context);

    if (!memberToDelete) {
      throw new CrudExeption("Channel member not found", 404);
    }

    const isWorkspaceAdmin = userIsWorkspaceAdmin(context.user, context.workspace);

    if (!isWorkspaceAdmin) {
      throw new CrudExeption("Channel member can not be deleted", 400);
    }

    const result = await this.service.delete(pk, context);

    await this.onDeleted(channel, memberToDelete, result);

    return result;
  }

  list(
    pagination: Pagination,
    context: WorkspaceExecutionContext,
  ): Promise<ListResult<ChannelMember>> {
    return this.service.list(pagination, context);
  }

  getPrimaryKey(channelOrPrimaryKey: Channel | ChannelPrimaryKey): ChannelPrimaryKey {
    return pick(channelOrPrimaryKey, ...(["company_id", "workspace_id", "id"] as const));
  }

  async onUpdated(
    channel: Channel,
    member: ChannelMember,
    result: SaveResult<Channel>,
  ): Promise<SaveResult<ChannelMember>> {
    return result;
  }

  async onCreated(
    channel: Channel,
    member: ChannelMember,
    result: SaveResult<Channel>,
  ): Promise<SaveResult<ChannelMember>> {
    return result;
  }

  async onDeleted(
    channel: Channel,
    member: ChannelMember,
    result: DeleteResult<ChannelMember>,
  ): Promise<DeleteResult<ChannelPrimaryKey>> {
    return result;
  }
}

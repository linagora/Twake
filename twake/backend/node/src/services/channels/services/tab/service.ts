import _ from "lodash";
import { RealtimeSaved, RealtimeDeleted } from "../../../../core/platform/framework";
import {
  DeleteResult,
  Pagination,
  ListResult,
  SaveResult,
  OperationType,
  UpdateResult,
  CrudExeption,
} from "../../../../core/platform/framework/api/crud-service";
import {  MemberService, TabService } from "../../provider";
import { ChannelMember, ChannelTab, ChannelTabPrimaryKey } from "../../entities";
import { ChannelExecutionContext, ChannelMemberType, ChannelVisibility } from "../../types";
import { Channel } from "../../../types";
import { DatabaseServiceAPI } from "../../../../core/platform/services/database/api";
import { ResourcePath } from "../../../../core/platform/services/realtime/types";
import Repository from "../../../../core/platform/services/database/services/orm/repository/repository";
import {isDirectChannel} from "../../utils"

export class Service implements TabService {
  version: "1";
  repository: Repository<ChannelTab>;

  constructor(private database: DatabaseServiceAPI, private members: MemberService) {}

  async init(): Promise<this> {
    this.repository = await this.database.getRepository("channel_tabs", ChannelTab);
    return this;
  }

  @RealtimeSaved<ChannelTab>((tab, context) => [
    {
      room: ResourcePath.get(getTabsRealtimeRoom((context as ChannelExecutionContext).channel)),
      path: getTabsRealtimeResourcePath(tab, (context as ChannelExecutionContext).channel),
    },
  ])
  async save<ChannelTabSaveOptions>(
    tab: ChannelTab,
    options: ChannelTabSaveOptions,
    context: ChannelExecutionContext,
  ): Promise<SaveResult<ChannelTab>> {
    const pk = {
      company_id: context.channel.company_id,
      workspace_id: context.channel.workspace_id,
      channel_id: context.channel.id,
      id: tab.id,
    };

    if (isDirectChannel(context.channel)){
      throw CrudExeption.badRequest("Can not create tab in direct channel");
    }
    
    if (!(await this.userIsChannelMember(pk, context))) {
      throw CrudExeption.badRequest("User is now allowed to create tab");
    }

    let tabEntity = await this.repository.findOne(pk);
    if (!tabEntity || !tab.id) {
      tabEntity = new ChannelTab();
      tabEntity = _.merge(tabEntity, pk);
      tabEntity.owner = context.user.id;
    }

    tabEntity = _.merge(
      tabEntity,
      _.pick(tab, ["name", "configuration", "application_id", "order"]),
    );
    
    await this.repository.save(tabEntity);

    return new SaveResult("channel_tabs", tabEntity, OperationType.CREATE);
  }

  async get(tabPk: ChannelTabPrimaryKey, context: ChannelExecutionContext): Promise<ChannelTab> {
    const pk = {
      company_id: context.channel.company_id,
      workspace_id: context.channel.workspace_id,
      channel_id: context.channel.id,
      id: tabPk.id,
    };
    return await this.repository.findOne(pk);
  }

  @RealtimeDeleted<ChannelTab>((tab, context) => [
    {
      room: ResourcePath.get(getTabsRealtimeRoom((context as ChannelExecutionContext).channel)),
      path: getTabsRealtimeResourcePath(tab, (context as ChannelExecutionContext).channel),
    },
  ])
  async delete(pk: ChannelTabPrimaryKey, context: ChannelExecutionContext): Promise<DeleteResult<ChannelTab>> {
    let tabEntity = await this.repository.findOne(pk);
    
    if (!(await this.userIsChannelMember(pk, context))) {
      throw CrudExeption.badRequest("User is not channel member");
    }
    if (tabEntity) {
      await this.repository.remove(tabEntity);
    }
    
    return new DeleteResult("channel_tabs", tabEntity, true);
  }

  async list<ListOptions>(
    pagination: Pagination,
    options: ListOptions,
    context: ChannelExecutionContext,
  ): Promise<ListResult<ChannelTab>> {
    const pk = {
      company_id: context.channel.company_id,
      workspace_id: context.channel.workspace_id,
      channel_id: context.channel.id,
    };
    return await this.repository.find(pk, { pagination });
  }

  onUpdated(
    channel: Channel,
    tab: ChannelTab,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    updateResult: UpdateResult<ChannelTab>,
  ): void {
    console.log("Tab updated", tab);
  }

  onCreated(
    channel: Channel,
    tab: ChannelTab,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    createResult: SaveResult<ChannelTab>,
  ): void {
    console.log("Tab created", tab);
  }

  onDeleted(channel: Channel, tab: ChannelTab): void {
    console.log("Tab deleted", tab);
  }

  userIsChannelMember(pk: ChannelTabPrimaryKey, context: ChannelExecutionContext): Promise<ChannelMember>{
    return (this.members.get({
      channel_id: pk.channel_id,
      company_id: pk.company_id,
      workspace_id: pk.workspace_id,
      user_id: context.user.id,
    }));
  }
}

export function getTabsRealtimeRoom(channel: ChannelExecutionContext["channel"]): string {
  return `/companies/${channel.company_id}/workspaces/${channel.workspace_id}/channels/${channel.id}/tabs`;
}

export function getTabsRealtimeResourcePath(
  tab: ChannelTab,
  channel: ChannelExecutionContext["channel"],
): string {
  return `/companies/${channel.company_id}/workspaces/${channel.workspace_id}/channels/${channel.id}/tabs/${tab.id}`;
}

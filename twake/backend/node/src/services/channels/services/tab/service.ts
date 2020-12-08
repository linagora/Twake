import { RealtimeSaved, RealtimeDeleted } from "../../../../core/platform/framework";
import { getChannelPath } from "../channel/realtime";
import {
  DeleteResult,
  Pagination,
  ListResult,
  SaveResult,
  OperationType,
  UpdateResult,
} from "../../../../core/platform/framework/api/crud-service";
import { TabService } from "../../provider";

import { ChannelTab, ChannelTabPrimaryKey } from "../../entities";
import { ChannelExecutionContext } from "../../types";
import { Channel } from "../../../types";
import { DatabaseServiceAPI } from "../../../../core/platform/services/database/api";
import _ from "lodash";
import { ResourcePath } from "../../../../core/platform/services/realtime/types";

export class Service implements TabService {
  version: "1";

  constructor(private database: DatabaseServiceAPI) {}

  async init(): Promise<this> {
    await this.database.getRepository("channel_tab").init(ChannelTab);
    return this;
  }

  @RealtimeSaved<ChannelTab>(
    (_tab, context) =>
      ResourcePath.get(getTabsRealtimeRoom((context as ChannelExecutionContext).channel)),
    (tab, context) =>
      getTabsRealtimeResourcePath(tab, (context as ChannelExecutionContext).channel),
  )
  async save(
    tab: ChannelTab,
    options: {},
    context: ChannelExecutionContext,
  ): Promise<SaveResult<ChannelTab>> {
    const manager = this.database.newManager();

    const pk = {
      company_id: context.channel.company_id,
      workspace_id: context.channel.workspace_id,
      channel_id: context.channel.id,
      id: tab.id,
    };

    let tabEntity = await this.database.getRepository<ChannelTab>("channel_tab").findOne(pk);
    if (!tabEntity) {
      tabEntity = new ChannelTab();
      tabEntity = _.merge(tabEntity, pk);
      tabEntity.owner = context.user.id;
    }

    tabEntity = _.merge(
      tabEntity,
      _.pick(tab, ["name", "configuration", "application_id", "order"]),
    );

    manager.persist(tabEntity);
    await manager.flush();

    return new SaveResult("channel_tab", tabEntity, OperationType.CREATE);
  }

  async get(tabPk: ChannelTabPrimaryKey, context: ChannelExecutionContext): Promise<ChannelTab> {
    const pk = {
      company_id: context.channel.company_id,
      workspace_id: context.channel.workspace_id,
      channel_id: context.channel.id,
      id: tabPk.id,
    };
    return await this.database.getRepository<ChannelTab>("channel_tab").findOne(pk);
  }

  @RealtimeDeleted<ChannelTab>(
    (_tab, context) =>
      ResourcePath.get(getTabsRealtimeRoom((context as ChannelExecutionContext).channel)),
    (tab, context) =>
      getTabsRealtimeResourcePath(tab, (context as ChannelExecutionContext).channel),
  )
  async delete(
    pk: ChannelTabPrimaryKey,
    context: ChannelExecutionContext,
  ): Promise<DeleteResult<ChannelTab>> {
    const manager = this.database.newManager();

    manager.remove(pk, ChannelTab);
    await manager.flush();

    return new DeleteResult("channel_tab", pk as ChannelTab, true);
  }

  async list(
    pagination: Pagination,
    options: {},
    context: ChannelExecutionContext,
  ): Promise<ListResult<ChannelTab>> {
    const pk = {
      company_id: context.channel.company_id,
      workspace_id: context.channel.workspace_id,
      channel_id: context.channel.id,
    };
    return await this.database.getRepository<ChannelTab>("channel_tab").find(pk, {
      pagination: pagination,
    });
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

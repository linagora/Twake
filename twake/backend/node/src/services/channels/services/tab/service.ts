import { RealtimeDeleted } from "../../../../core/platform/framework";
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
import { Channel, User } from "../../../types";
import { pick } from "../../../../utils/pick";
import { DatabaseServiceAPI } from "../../../../core/platform/services/database/api";
import _ from "lodash";

export class Service implements TabService {
  version: "1";

  constructor(private database: DatabaseServiceAPI) {}

  async init(): Promise<this> {
    await this.database.getRepository("channel_tab").init(ChannelTab);
    return this;
  }

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

  async delete(
    pk: ChannelTabPrimaryKey,
    context: ChannelExecutionContext,
  ): Promise<DeleteResult<ChannelTab>> {
    const manager = this.database.newManager();

    manager.remove(pk);
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

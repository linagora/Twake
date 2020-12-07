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

export class Service implements TabService {
  version: "1";

  constructor(private database: DatabaseServiceAPI) {}

  async init(): Promise<this> {
    this.database.getRepository("channel_tab").init(ChannelTab);
    const manager = this.database.newManager();

    const tab = new ChannelTab();
    manager.persist(tab);
    manager.flush();

    return this;
  }

  async save(
    tab: ChannelTab,
    options: {},
    context: ChannelExecutionContext,
  ): Promise<SaveResult<ChannelTab>> {
    /*    const existingTab: ChannelTab = this.database.getRepository("channel_tab").get<ChannelTab>();

    existingTab.name = "Some name";

    this.database.getManager().persist(existingTab);
    this.database.getManager().flush();
*/
    return new SaveResult("none", null, OperationType.CREATE);
  }

  async get(pk: ChannelTabPrimaryKey, context: ChannelExecutionContext): Promise<ChannelTab> {
    return null; //await this.database.getRepository("channel_tab").get(this.getPrimaryKey(pk), context);
  }

  async delete(
    pk: ChannelTabPrimaryKey,
    context: ChannelExecutionContext,
  ): Promise<DeleteResult<ChannelTab>> {
    return new DeleteResult("", null, true);
  }

  list(
    pagination: Pagination,
    options: {},
    context: ChannelExecutionContext,
  ): Promise<ListResult<ChannelTab>> {
    return null; //this.database.getRepository("channel_tab").list(pagination, options, context);
  }

  async listUserChannels(
    user: User,
    pagination: Pagination,
    context: ChannelExecutionContext,
  ): Promise<ListResult<ChannelTab>> {
    return new ListResult("none", []);
  }

  onUpdated(
    channel: Channel,
    tab: ChannelTab,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    updateResult: UpdateResult<ChannelTab>,
  ): void {
    console.log("Member updated", tab);
  }

  onCreated(
    channel: Channel,
    tab: ChannelTab,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    createResult: SaveResult<ChannelTab>,
  ): void {
    console.log("Member created", tab);
  }

  onDeleted(channel: Channel, tab: ChannelTab): void {
    console.log("Member deleted", tab);
  }

  getPrimaryKey(tabOrPrimaryKey: ChannelTab | ChannelTabPrimaryKey): ChannelTabPrimaryKey {
    return pick(tabOrPrimaryKey, ...(["company_id", "workspace_id", "channel_id", "id"] as const));
  }
}

import { RealtimeDeleted } from "../../../../core/platform/framework";
import {
  DeleteResult,
  Pagination,
  ListResult,
  SaveResult,
  OperationType,
  UpdateResult,
  ListOptions,
} from "../../../../core/platform/framework/api/crud-service";
import { TabService } from "../../provider";

import { Tab, TabPrimaryKey } from "../../entities";
import { ChannelExecutionContext } from "../../types";
import { Channel, User } from "../../../types";
import { pick } from "../../../../utils/pick";

export class Service implements TabService {
  version: "1";

  constructor(private service: TabService) {}

  async init(): Promise<this> {
    try {
      this.service.init && (await this.service.init());
    } catch (err) {
      console.error("Can not initialize channel tab service");
    }

    return this;
  }

  async save(tab: Tab, context: ChannelExecutionContext): Promise<SaveResult<Tab>> {
    return new SaveResult("none", null, OperationType.CREATE);
  }

  async get(pk: TabPrimaryKey, context: ChannelExecutionContext): Promise<Tab> {
    // FIXME: Who can fetch a single tab?
    return await this.service.get(this.getPrimaryKey(pk), context);
  }

  async delete(pk: TabPrimaryKey, context: ChannelExecutionContext): Promise<DeleteResult<Tab>> {
    return new DeleteResult("", null, true);
  }

  list(
    pagination: Pagination,
    options: ListOptions,
    context: ChannelExecutionContext,
  ): Promise<ListResult<Tab>> {
    return this.service.list(pagination, options, context);
  }

  async listUserChannels(
    user: User,
    pagination: Pagination,
    context: ChannelExecutionContext,
  ): Promise<ListResult<Tab>> {
    return new ListResult("none", []);
  }

  onUpdated(
    channel: Channel,
    tab: Tab,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    updateResult: UpdateResult<Tab>,
  ): void {
    console.log("Member updated", tab);
  }

  onCreated(
    channel: Channel,
    tab: Tab,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    createResult: SaveResult<Tab>,
  ): void {
    console.log("Member created", tab);
  }

  onDeleted(channel: Channel, tab: Tab): void {
    console.log("Member deleted", tab);
  }

  getPrimaryKey(tabOrPrimaryKey: Tab | TabPrimaryKey): TabPrimaryKey {
    return pick(tabOrPrimaryKey, ...(["company_id", "workspace_id", "channel_id", "id"] as const));
  }
}

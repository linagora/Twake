import { CRUDService } from "../../core/platform/framework/api/crud-service";
import { TwakeServiceProvider } from "../../core/platform/framework/api";
import { Channel } from "./entities";

export type ChannelPrimaryKey = {
  id?: string;
  company_id?: string;
  workspace_id?: string;
};

export default interface ChannelServiceAPI
  extends TwakeServiceProvider,
    CRUDService<Channel, ChannelPrimaryKey> {}

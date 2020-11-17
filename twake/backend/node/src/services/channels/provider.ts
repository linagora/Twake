import { CRUDService } from "../../core/platform/framework/api/crud-service";
import { TwakeServiceProvider, Initializable } from "../../core/platform/framework/api";
import { Channel, ChannelMember } from "./entities";
import { WorkspaceExecutionContext } from "./types";

export type ChannelPrimaryKey = {
  id?: string;
  company_id?: string;
  workspace_id?: string;
};

export interface ChannelService
  extends TwakeServiceProvider,
    Initializable,
    CRUDService<Channel, ChannelPrimaryKey, WorkspaceExecutionContext> {}
export interface MemberService
  extends TwakeServiceProvider,
    Initializable,
    CRUDService<ChannelMember, ChannelPrimaryKey, WorkspaceExecutionContext> {}

export default interface ChannelServiceAPI extends TwakeServiceProvider, Initializable {
  channels: ChannelService;
  members: MemberService;
}

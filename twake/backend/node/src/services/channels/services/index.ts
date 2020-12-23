import { DatabaseServiceAPI } from "../../../core/platform/services/database/api";
import { ChannelMember } from "../entities";
import ChannelServiceAPI, { MemberService, ChannelService, TabService } from "../provider";
import { getService as getChannelService } from "./channel";
import { getService as getMemberService } from "./member";
import { getService as getTabService } from "./tab";

export function getService(databaseService: DatabaseServiceAPI): ChannelServiceAPI {
  return getServiceInstance(databaseService);
}

function getServiceInstance(databaseService: DatabaseServiceAPI): ChannelServiceAPI {
  return new Service(databaseService);
}

class Service implements ChannelServiceAPI {
  version: "1";
  channels: ChannelService;
  members: MemberService;
  tabs: TabService;
  

  constructor(databaseService: DatabaseServiceAPI) {
    this.members = getMemberService(databaseService);
    this.channels = getChannelService(databaseService, this.members);
    this.tabs = getTabService(databaseService, this.members);
  }

  async init(): Promise<this> {
    try {
      await Promise.all([this.channels.init(), this.members.init(), this.tabs.init()]);
    } catch (err) {
      console.error("Error while initializing channel", err);
    }
    return this;
  }
}

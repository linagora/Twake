import { DatabaseServiceAPI } from "../../../core/platform/services/database/api";
import ChannelServiceAPI, { MemberService, ChannelService } from "../provider";
import { getService as getChannelService } from "./channel";
import { getService as getMemberService } from "./member";

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

  constructor(databaseService: DatabaseServiceAPI) {
    this.members = getMemberService(databaseService);
    this.channels = getChannelService(databaseService, this.members);
  }

  async init(): Promise<this> {
    try {
      await Promise.all([this.channels.init(), this.members.init()]);
    } catch (err) {
      console.error("Error while initializing", err);
    }
    return this;
  }
}

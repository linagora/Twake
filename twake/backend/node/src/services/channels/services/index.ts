import { PubsubServiceAPI } from "../../../core/platform/services/pubsub/api";
import { DatabaseServiceAPI } from "../../../core/platform/services/database/api";
import ChannelServiceAPI, { MemberService, ChannelService, TabService } from "../provider";
import { getService as getChannelService } from "./channel";
import { getService as getMemberService } from "./member";
import { getService as getTabService } from "./tab";
import { NewChannelActivityProcessor } from "./channel/new-channel-activity";

export function getService(
  databaseService: DatabaseServiceAPI,
  pubsub: PubsubServiceAPI,
): ChannelServiceAPI {
  return getServiceInstance(databaseService, pubsub);
}

function getServiceInstance(
  databaseService: DatabaseServiceAPI,
  pubsub: PubsubServiceAPI,
): ChannelServiceAPI {
  return new Service(databaseService, pubsub);
}

class Service implements ChannelServiceAPI {
  version: "1";
  channels: ChannelService;
  members: MemberService;
  tabs: TabService;
  pubsub: PubsubServiceAPI;

  constructor(databaseService: DatabaseServiceAPI, pubsub: PubsubServiceAPI) {
    this.pubsub = pubsub;
    this.members = getMemberService(databaseService);
    this.channels = getChannelService(databaseService, this.members);
    this.tabs = getTabService(databaseService);
  }

  async init(): Promise<this> {
    this.pubsub.processor.addHandler(new NewChannelActivityProcessor(this.channels));

    try {
      await Promise.all([this.channels.init(), this.members.init(), this.tabs.init()]);
    } catch (err) {
      console.error("Error while initializing channel", err);
    }

    return this;
  }
}

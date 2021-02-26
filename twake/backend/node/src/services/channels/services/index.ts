import { PubsubServiceAPI } from "../../../core/platform/services/pubsub/api";
import { DatabaseServiceAPI } from "../../../core/platform/services/database/api";
import ChannelServiceAPI, { MemberService, ChannelService, TabService } from "../provider";
import { getService as getChannelService } from "./channel";
import { getService as getMemberService } from "./member";
import { getService as getTabService } from "./tab";
import { PubsubListener } from "./pubsub";
import Activities from "./channel/activities/service";
import { getService as getActivitiesService } from "./channel/activities";

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
  activities: Activities;
  pubsub: PubsubServiceAPI;
  pubsubListener: PubsubListener;

  constructor(databaseService: DatabaseServiceAPI, pubsub: PubsubServiceAPI) {
    this.pubsub = pubsub;
    this.members = getMemberService(databaseService, this);
    this.channels = getChannelService(databaseService, this);
    this.tabs = getTabService(databaseService);
    this.activities = getActivitiesService(pubsub);
    this.pubsubListener = new PubsubListener(this, pubsub);
  }

  async init(): Promise<this> {
    try {
      await Promise.all([
        this.activities.init(),
        this.channels.init(),
        this.members.init(),
        this.tabs.init(),
        this.pubsubListener.init(),
      ]);
    } catch (err) {
      console.error("Error while initializing channel", err);
    }

    return this;
  }
}

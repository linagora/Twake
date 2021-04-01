import { PubsubServiceAPI } from "../../../core/platform/services/pubsub/api";
import { DatabaseServiceAPI } from "../../../core/platform/services/database/api";
import ChannelServiceAPI, {
  MemberService,
  ChannelService,
  TabService,
  ChannelPendingEmailService,
} from "../provider";
import { getService as getChannelService } from "./channel";
import { getService as getMemberService } from "./member";
import { getService as getTabService } from "./tab";
import { PubsubListener } from "./pubsub";
import Activities from "./channel/activities/service";
import { getService as getActivitiesService } from "./channel/activities";
import UserServiceAPI from "../../user/api";
import ChannelPendingEmailsService from "./channel/pending-emails/service";

export function getService(
  databaseService: DatabaseServiceAPI,
  pubsub: PubsubServiceAPI,
  user: UserServiceAPI,
): ChannelServiceAPI {
  return getServiceInstance(databaseService, pubsub, user);
}
function getServiceInstance(
  databaseService: DatabaseServiceAPI,
  pubsub: PubsubServiceAPI,
  user: UserServiceAPI,
): ChannelServiceAPI {
  return new Service(databaseService, pubsub, user);
}

class Service implements ChannelServiceAPI {
  version: "1";
  channels: ChannelService;
  members: MemberService;
  tabs: TabService;
  activities: Activities;
  pubsubListener: PubsubListener;
  pendingEmails: ChannelPendingEmailService;

  constructor(databaseService: DatabaseServiceAPI, pubsub: PubsubServiceAPI, user: UserServiceAPI) {
    this.members = getMemberService(databaseService, this);
    this.channels = getChannelService(databaseService, this, user);
    this.tabs = getTabService(databaseService);
    this.activities = getActivitiesService(pubsub);
    this.pubsubListener = new PubsubListener(this, pubsub);
    this.pendingEmails = new ChannelPendingEmailsService(databaseService);
  }

  async init(): Promise<this> {
    try {
      await Promise.all([
        this.activities.init(),
        this.channels.init(),
        this.members.init(),
        this.tabs.init(),
        this.pubsubListener.init(),
        this.pendingEmails.init(),
      ]);
    } catch (err) {
      console.error("Error while initializing channel", err);
    }

    return this;
  }
}

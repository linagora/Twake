import ChannelServiceAPI, {
  ChannelPendingEmailService,
  ChannelService,
  MemberService,
  TabService,
} from "../provider";
import { getService as getChannelService } from "./channel";
import { getService as getMemberService } from "./member";
import { getService as getTabService } from "./tab";
import { PubsubListener } from "./pubsub";
import Activities from "./channel/activities/service";
import { getService as getActivitiesService } from "./channel/activities";
import UserServiceAPI from "../../user/api";
import ChannelPendingEmailsService from "./channel/pending-emails/service";
import { PlatformServicesAPI } from "../../../core/platform/services/platform-services";

export function getService(
  platformServices: PlatformServicesAPI,
  user: UserServiceAPI,
): ChannelServiceAPI {
  return getServiceInstance(platformServices, user);
}
function getServiceInstance(
  platformServices: PlatformServicesAPI,
  user: UserServiceAPI,
): ChannelServiceAPI {
  return new Service(platformServices, user);
}

class Service implements ChannelServiceAPI {
  version: "1";
  channels: ChannelService;
  members: MemberService;
  tabs: TabService;
  activities: Activities;
  pubsubListener: PubsubListener;
  pendingEmails: ChannelPendingEmailService;

  constructor(platformServices: PlatformServicesAPI, user: UserServiceAPI) {
    this.members = getMemberService(platformServices, this, user);
    this.channels = getChannelService(platformServices, this, user);
    this.tabs = getTabService(platformServices.database);
    this.activities = getActivitiesService(platformServices.pubsub);
    this.pubsubListener = new PubsubListener(this, platformServices.pubsub, user);
    this.pendingEmails = new ChannelPendingEmailsService(platformServices.database, user, this);
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

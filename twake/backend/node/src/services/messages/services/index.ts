import { TwakeContext } from "../../../core/platform/framework";
import { DatabaseServiceAPI } from "../../../core/platform/services/database/api";
import { PubsubServiceAPI } from "../../../core/platform/services/pubsub/api";
import {
  MessageUserBookmarksServiceAPI,
  MessageThreadsServiceAPI,
  MessageThreadMessagesServiceAPI,
  MessageViewsServiceAPI,
  MessageServiceAPI,
} from "../api";

import { getService as getMessageUserBookmarksServiceAPI } from "./user-bookmarks";
import { getService as getMessageThreadsServiceAPI } from "./threads";
import { getService as getMessageThreadMessagesServiceAPI } from "./messages";
import { getService as getMessageViewsServiceAPI } from "./views";
import { MessagesEngine } from "./engine";
import UserServiceAPI from "../../user/api";
import ChannelServiceAPI from "../../channels/provider";
import { FileServiceAPI } from "../../files/api";
import { ApplicationServiceAPI } from "../../applications/api";
import { PlatformServicesAPI } from "../../../core/platform/services/platform-services";
import { StatisticsAPI } from "../../statistics/types";

export function getService(
  platformServices: PlatformServicesAPI,
  user: UserServiceAPI,
  channel: ChannelServiceAPI,
  files: FileServiceAPI,
  applications: ApplicationServiceAPI,
  statistics: StatisticsAPI,
): Service {
  return new Service(platformServices, user, channel, files, applications, statistics);
}

export default class Service implements MessageServiceAPI {
  version: "1";
  userBookmarks: MessageUserBookmarksServiceAPI;
  threads: MessageThreadsServiceAPI;
  messages: MessageThreadMessagesServiceAPI;
  views: MessageViewsServiceAPI;
  engine: MessagesEngine;
  statistics: StatisticsAPI;

  constructor(
    platformServices: PlatformServicesAPI,
    user: UserServiceAPI,
    channel: ChannelServiceAPI,
    files: FileServiceAPI,
    applications: ApplicationServiceAPI,
    statistics: StatisticsAPI,
  ) {
    this.userBookmarks = getMessageUserBookmarksServiceAPI(platformServices.database);
    this.messages = getMessageThreadMessagesServiceAPI(
      platformServices.database,
      user,
      channel,
      files,
      applications,
      this,
    );
    this.threads = getMessageThreadsServiceAPI(platformServices.database, this);
    this.views = getMessageViewsServiceAPI(platformServices.database, this);
    this.engine = new MessagesEngine(
      platformServices.database,
      platformServices.pubsub,
      user,
      channel,
      this,
      statistics,
    );

    this.statistics = statistics;
  }

  async init(context: TwakeContext): Promise<this> {
    try {
      await Promise.all([
        this.userBookmarks.init(context),
        this.threads.init(context),
        this.messages.init(context),
        this.views.init(context),
        this.engine.init(),
      ]);
    } catch (err) {
      console.error("Error while initializing messages service", err);
    }
    return this;
  }
}

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

export function getService(
  databaseService: DatabaseServiceAPI,
  pubsub: PubsubServiceAPI,
  user: UserServiceAPI,
  channel: ChannelServiceAPI,
): Service {
  return getServiceInstance(databaseService, pubsub, user, channel);
}

function getServiceInstance(
  databaseService: DatabaseServiceAPI,
  pubsub: PubsubServiceAPI,
  user: UserServiceAPI,
  channel: ChannelServiceAPI,
): Service {
  return new Service(databaseService, pubsub, user, channel);
}

export default class Service implements MessageServiceAPI {
  version: "1";

  userBookmarks: MessageUserBookmarksServiceAPI;
  threads: MessageThreadsServiceAPI;
  messages: MessageThreadMessagesServiceAPI;
  views: MessageViewsServiceAPI;
  engine: MessagesEngine;

  constructor(
    databaseService: DatabaseServiceAPI,
    pubsub: PubsubServiceAPI,
    user: UserServiceAPI,
    channel: ChannelServiceAPI,
  ) {
    this.userBookmarks = getMessageUserBookmarksServiceAPI(databaseService);
    this.messages = getMessageThreadMessagesServiceAPI(databaseService, user, channel, this);
    this.threads = getMessageThreadsServiceAPI(databaseService, this);
    this.views = getMessageViewsServiceAPI(databaseService, this);
    this.engine = new MessagesEngine(databaseService, pubsub, user, channel, this);
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

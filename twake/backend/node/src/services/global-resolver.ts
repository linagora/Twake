import { FastifyInstance } from "fastify";
import { IncomingMessage, Server, ServerResponse } from "http";

import { TwakePlatform } from "../core/platform/platform";
import { RealtimeServiceAPI } from "../core/platform/services/realtime/api";
import WebServerAPI from "../core/platform/services/webserver/provider";
import { SearchServiceAPI } from "../core/platform/services/search/api";
import StorageAPI from "../core/platform/services/storage/provider";
import { MessageQueueServiceAPI } from "../core/platform/services/message-queue/api";
import { CounterAPI } from "../core/platform/services/counter/types";
import { DatabaseServiceAPI } from "../core/platform/services/database/api";
import AuthServiceAPI from "../core/platform/services/auth/provider";
import { PushServiceAPI } from "../core/platform/services/push/api";
import { CronAPI } from "../core/platform/services/cron/api";
import WebSocketAPI from "../core/platform/services/websocket/provider";
import TrackerAPI from "../core/platform/services/tracker/provider";
import KnowledgeGraphService from "../core/platform/services/knowledge-graph";
import EmailPusherAPI from "../core/platform/services/email-pusher/provider";

import { logger } from "../core/platform/framework";
import assert from "assert";
import { CompanyServiceImpl } from "./user/services/companies";
import { WorkspaceServiceImpl } from "./workspaces/services/workspace";
import { UserExternalLinksServiceImpl } from "./user/services/external_links";
import { UserNotificationBadgeService } from "./notifications/services/bages";
import { NotificationPreferencesService } from "./notifications/services/preferences";
import { ThreadMessagesService } from "./messages/services/messages";
import { MessagesFilesService } from "./messages/services/messages-files";
import { ThreadsService } from "./messages/services/threads";
import { UserBookmarksService } from "./messages/services/user-bookmarks";
import { UserServiceImpl } from "./user/services/users/service";
import { CompanyApplicationServiceImpl } from "./applications/services/company-applications";
import { ApplicationServiceImpl } from "./applications/services/applications";
import { ViewsServiceImpl } from "./messages/services/views";
import { MessagesEngine } from "./messages/services/engine";
import { FileServiceImpl } from "./files/services";
import { ChannelServiceImpl } from "./channels/services/channel/service";
import { MemberServiceImpl } from "./channels/services/member/service";
import ChannelPendingEmailServiceImpl from "./channels/services/channel/pending-emails/service";
import { TabServiceImpl } from "./channels/services/tab";
import { ConsoleServiceImpl } from "./console/service";
import { StatisticsServiceImpl } from "./statistics/service";
import { NotificationEngine } from "./notifications/services/engine";
import { MobilePushService } from "./notifications/services/mobile-push";
import { ChannelMemberPreferencesServiceImpl } from "./notifications/services/channel-preferences";
import { ChannelThreadUsersServiceImpl } from "./notifications/services/channel-thread-users";
import { PreviewProcessService } from "./previews/services/files/processing/service";
import { ApplicationHooksService } from "./applications/services/hooks";
import OnlineServiceImpl from "./online/service";
import { PreviewEngine } from "./previews/services/files/engine";
import { ChannelsMessageQueueListener } from "./channels/services/pubsub";
import { LinkPreviewProcessService } from "./previews/services/links/processing/service";
import { LinkPreviewEngine } from "./previews/services/links/engine";
import { UserNotificationDigestService } from "./notifications/services/digest";
import { DocumentsService } from "./documents/services";
import { DocumentsEngine } from "./documents/services/engine";

type PlatformServices = {
  auth: AuthServiceAPI;
  counter: CounterAPI;
  cron: CronAPI;
  messageQueue: MessageQueueServiceAPI;
  push: PushServiceAPI;
  realtime: RealtimeServiceAPI;
  search: SearchServiceAPI;
  storage: StorageAPI;
  tracker: TrackerAPI;
  webserver: WebServerAPI;
  websocket: WebSocketAPI;
  knowledgeGraph: KnowledgeGraphService;
  emailPusher: EmailPusherAPI;
};

type TwakeServices = {
  workspaces: WorkspaceServiceImpl;
  companies: CompanyServiceImpl;
  users: UserServiceImpl;
  console: ConsoleServiceImpl;
  statistics: StatisticsServiceImpl;
  externalUser: UserExternalLinksServiceImpl;
  notifications: {
    badges: UserNotificationBadgeService;
    channelPreferences: ChannelMemberPreferencesServiceImpl;
    channelThreads: ChannelThreadUsersServiceImpl;
    engine: NotificationEngine;
    preferences: NotificationPreferencesService;
    mobilePush: MobilePushService;
    digest: UserNotificationDigestService;
  };
  preview: {
    files: PreviewProcessService;
    links: LinkPreviewProcessService;
  };
  messages: {
    messages: ThreadMessagesService;
    messagesFiles: MessagesFilesService;
    threads: ThreadsService;
    userBookmarks: UserBookmarksService;
    views: ViewsServiceImpl;
    engine: MessagesEngine;
  };
  applications: {
    marketplaceApps: ApplicationServiceImpl;
    companyApps: CompanyApplicationServiceImpl;
    hooks: ApplicationHooksService;
  };
  files: FileServiceImpl;
  channels: {
    channels: ChannelServiceImpl;
    members: MemberServiceImpl;
    pubsub: ChannelsMessageQueueListener;
  };
  channelPendingEmail: ChannelPendingEmailServiceImpl;
  tab: TabServiceImpl;
  online: OnlineServiceImpl;
  documents: {
    documents: DocumentsService;
    engine: DocumentsEngine;
  };
};

class GlobalResolver {
  public services: TwakeServices;
  public platformServices: PlatformServices;
  public database: DatabaseServiceAPI;

  public fastify: FastifyInstance<Server, IncomingMessage, ServerResponse>;

  private alreadyInitialized = false;

  async doInit(platform: TwakePlatform) {
    if (this.alreadyInitialized) {
      return;
    }
    this.database = platform.getProvider<DatabaseServiceAPI>("database");

    this.platformServices = {
      auth: platform.getProvider<AuthServiceAPI>("auth"),
      counter: platform.getProvider<CounterAPI>("counter"),
      cron: platform.getProvider<CronAPI>("cron"),
      messageQueue: platform.getProvider<MessageQueueServiceAPI>("message-queue"),
      push: platform.getProvider<PushServiceAPI>("push"),
      realtime: platform.getProvider<RealtimeServiceAPI>("realtime"),
      search: platform.getProvider<SearchServiceAPI>("search"),
      storage: platform.getProvider<StorageAPI>("storage"),
      tracker: platform.getProvider<TrackerAPI>("tracker"),
      webserver: platform.getProvider<WebServerAPI>("webserver"),
      websocket: platform.getProvider<WebSocketAPI>("websocket"),
      knowledgeGraph: await new KnowledgeGraphService().init(),
      emailPusher: platform.getProvider<EmailPusherAPI>("email-pusher"),
    };

    this.fastify = this.platformServices.webserver.getServer();

    Object.keys(this.platformServices).forEach((key: keyof PlatformServices) => {
      const service = this.platformServices[key];
      assert(service, `Platform service ${key} was not initialized`);
    });

    await new PreviewEngine().init();
    await new LinkPreviewEngine().init();

    this.services = {
      workspaces: await new WorkspaceServiceImpl().init(),
      companies: await new CompanyServiceImpl().init(),
      users: await new UserServiceImpl().init(),
      console: await new ConsoleServiceImpl().init(),
      statistics: await new StatisticsServiceImpl().init(),
      externalUser: await new UserExternalLinksServiceImpl().init(),
      notifications: {
        badges: await new UserNotificationBadgeService().init(platform),
        channelPreferences: await new ChannelMemberPreferencesServiceImpl().init(),
        channelThreads: await new ChannelThreadUsersServiceImpl().init(),
        engine: await new NotificationEngine().init(),
        preferences: await new NotificationPreferencesService().init(),
        mobilePush: await new MobilePushService().init(),
        digest: await new UserNotificationDigestService().init(),
      },
      preview: {
        files: await new PreviewProcessService().init(),
        links: await new LinkPreviewProcessService().init(),
      },
      messages: {
        messages: await new ThreadMessagesService().init(platform),
        messagesFiles: await new MessagesFilesService().init(),
        threads: await new ThreadsService().init(),
        userBookmarks: await new UserBookmarksService().init(),
        views: await new ViewsServiceImpl().init(),
        engine: await new MessagesEngine().init(),
      },
      applications: {
        marketplaceApps: await new ApplicationServiceImpl().init(),
        companyApps: await new CompanyApplicationServiceImpl().init(),
        hooks: await new ApplicationHooksService().init(),
      },
      files: await new FileServiceImpl().init(),
      channels: {
        channels: await new ChannelServiceImpl().init(),
        members: await new MemberServiceImpl().init(),
        pubsub: await new ChannelsMessageQueueListener().init(),
      },
      channelPendingEmail: await new ChannelPendingEmailServiceImpl().init(),
      tab: await new TabServiceImpl().init(),
      online: await new OnlineServiceImpl().init(),
      documents: {
        documents: await new DocumentsService().init(),
        engine: await new DocumentsEngine().init(),
      },
    };

    Object.keys(this.services).forEach((key: keyof TwakeServices) => {
      assert(this.services[key], `Service ${key} was not initialized`);
      if (this.services[key].constructor.name == "Object") {
        const subs = this.services[key] as any;
        Object.keys(subs).forEach(sk => {
          assert(subs[sk], `Service ${key}.${sk} was not initialized`);
        });
      }
    });

    logger.info("Global resolver finished initializing services");
    this.alreadyInitialized = true;
  }
}

export default new GlobalResolver();

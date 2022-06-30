import { TwakePlatform } from "../core/platform/platform";
import { ConsoleServiceAPI } from "./console/api";
import {
  ApplicationHooksServiceAPI,
  CompanyApplicationServiceAPI,
  MarketplaceApplicationServiceAPI,
} from "./applications/api";
import { StatisticsAPI } from "./statistics/types";
import { CompaniesServiceAPI, UserExternalLinksService, UsersService } from "./user/api";
import { CompanyServiceImpl } from "./user/services/companies";
import { RealtimeServiceAPI } from "../core/platform/services/realtime/api";
import WebServerAPI from "../core/platform/services/webserver/provider";
import { FastifyInstance } from "fastify";
import { IncomingMessage, Server, ServerResponse } from "http";
import { WorkspaceService } from "./workspaces/api";
import { WorkspaceServiceImpl } from "./workspaces/services/workspace";
import { UserExternalLinksServiceImpl } from "./user/services/external_links";
import { UserNotificationBadgeService } from "./notifications/services/bages";
import {
  ChannelMemberPreferencesServiceAPI,
  ChannelThreadUsersServiceAPI,
  UserNotificationBadgeServiceAPI,
  UserNotificationPreferencesAPI,
} from "./notifications/api";
import { DatabaseServiceAPI } from "../core/platform/services/database/api";
import { NotificationPreferencesService } from "./notifications/services/preferences";
import {
  MessageThreadMessagesServiceAPI,
  MessageThreadsServiceAPI,
  MessageUserBookmarksServiceAPI,
  MessageViewsServiceAPI,
} from "./messages/api";
import { ThreadMessagesService } from "./messages/services/messages";
import { ThreadsService } from "./messages/services/threads";
import { UserBookmarksService } from "./messages/services/user-bookmarks";
import { SearchServiceAPI } from "../core/platform/services/search/api";
import StorageAPI from "../core/platform/services/storage/provider";
import { PubsubServiceAPI } from "../core/platform/services/pubsub/api";
import { CounterAPI } from "../core/platform/services/counter/types";
import { UserServiceImpl } from "./user/services/users/service";
import { CompanyApplicationServiceImpl } from "./applications/services/company-applications";
import { ApplicationServiceImpl } from "./applications/services/applications";
import { ViewsServiceImpl } from "./messages/services/views";
import { MessagesEngine } from "./messages/services/engine";
import { FileServiceAPI } from "./files/api";
import { FileServiceImpl } from "./files/services";
import { ChannelServiceImpl } from "./channels/services/channel/service";
import { ChannelPendingEmailService } from "./channels/provider";
import { MemberServiceImpl } from "./channels/services/member/service";
import ChannelPendingEmailServiceImpl from "./channels/services/channel/pending-emails/service";
import { TabServiceImpl } from "./channels/services/tab";
import AuthServiceAPI from "../core/platform/services/auth/provider";
import { ConsoleServiceImpl } from "./console/service";
import { StatisticsServiceImpl } from "./statistics/service";
import { logger } from "../core/platform/framework";
import assert from "assert";
import { NotificationEngine } from "./notifications/services/engine";
import { MobilePushService } from "./notifications/services/mobile-push";
import { ChannelMemberPreferencesServiceImpl } from "./notifications/services/channel-preferences";
import { ChannelThreadUsersServiceImpl } from "./notifications/services/channel-thread-users";
import { PushServiceAPI } from "../core/platform/services/push/api";
import { PreviewProcessService } from "./previews/services/files/processing/service";
import { LinkPreviewServiceAPI, PreviewServiceAPI } from "./previews/types";
import { CronAPI } from "../core/platform/services/cron/api";
import WebSocketAPI from "../core/platform/services/websocket/provider";
import TrackerAPI from "../core/platform/services/tracker/provider";
import { ApplicationHooksService } from "./applications/services/hooks";
import { OnlineServiceAPI } from "./online/api";
import OnlineServiceImpl from "./online/service";
import { PreviewEngine } from "./previews/services/files/engine";
import KnowledgeGraphService from "../core/platform/services/knowledge-graph";
import { ChannelsPubsubListener } from "./channels/services/pubsub";
import { LinkPreviewProcessService } from "./previews/services/links/processing/service";
import { LinkPreviewEngine } from "./previews/services/links/engine";

type PlatformServices = {
  auth: AuthServiceAPI;
  counter: CounterAPI;
  cron: CronAPI;
  pubsub: PubsubServiceAPI;
  push: PushServiceAPI;
  realtime: RealtimeServiceAPI;
  search: SearchServiceAPI;
  storage: StorageAPI;
  tracker: TrackerAPI;
  webserver: WebServerAPI;
  websocket: WebSocketAPI;
};

type TwakeServices = {
  workspaces: WorkspaceService;
  companies: CompaniesServiceAPI;
  users: UsersService;
  console: ConsoleServiceAPI;
  statistics: StatisticsAPI;
  externalUser: UserExternalLinksService;
  notifications: {
    badges: UserNotificationBadgeServiceAPI;
    channelPreferences: ChannelMemberPreferencesServiceAPI;
    channelThreads: ChannelThreadUsersServiceAPI;
    engine: NotificationEngine;
    preferences: UserNotificationPreferencesAPI;
    mobilePush: MobilePushService;
  };
  preview: {
    files: PreviewServiceAPI;
    links: LinkPreviewServiceAPI;
  };
  messages: {
    messages: MessageThreadMessagesServiceAPI;
    threads: MessageThreadsServiceAPI;
    userBookmarks: MessageUserBookmarksServiceAPI;
    views: MessageViewsServiceAPI;
    engine: MessagesEngine;
  };
  applications: {
    marketplaceApps: MarketplaceApplicationServiceAPI;
    companyApps: CompanyApplicationServiceAPI;
    hooks: ApplicationHooksServiceAPI;
  };
  files: FileServiceAPI;
  channels: {
    channels: ChannelServiceImpl;
    members: MemberServiceImpl;
    pubsub: ChannelsPubsubListener;
  };
  channelPendingEmail: ChannelPendingEmailService;
  tab: TabServiceImpl;
  online: OnlineServiceAPI;
  knowledgeGraph: KnowledgeGraphService;
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
      pubsub: platform.getProvider<PubsubServiceAPI>("pubsub"),
      push: platform.getProvider<PushServiceAPI>("push"),
      realtime: platform.getProvider<RealtimeServiceAPI>("realtime"),
      search: platform.getProvider<SearchServiceAPI>("search"),
      storage: platform.getProvider<StorageAPI>("storage"),
      tracker: platform.getProvider<TrackerAPI>("tracker"),
      webserver: platform.getProvider<WebServerAPI>("webserver"),
      websocket: platform.getProvider<WebSocketAPI>("websocket"),
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
      },
      preview: {
        files: await new PreviewProcessService().init(),
        links: await new LinkPreviewProcessService().init(),
      },
      messages: {
        messages: await new ThreadMessagesService().init(platform),
        threads: await new ThreadsService().init(platform),
        userBookmarks: await new UserBookmarksService().init(platform),
        views: await new ViewsServiceImpl().init(platform),
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
        pubsub: await new ChannelsPubsubListener().init(),
      },
      channelPendingEmail: await new ChannelPendingEmailServiceImpl().init(),
      tab: await new TabServiceImpl().init(),
      online: await new OnlineServiceImpl().init(),
      knowledgeGraph: await new KnowledgeGraphService().init(),
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

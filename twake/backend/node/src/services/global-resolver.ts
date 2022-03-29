import { TwakePlatform } from "../core/platform/platform";
import { ConsoleServiceAPI } from "./console/api";
import { CompanyApplicationServiceAPI, MarketplaceApplicationServiceAPI } from "./applications/api";
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
import {
  ChannelPendingEmailService,
  ChannelService,
  MemberService,
  TabService,
} from "./channels/provider";
import { MemberServiceImpl } from "./channels/services/member/service";
import ChannelPendingEmailServiceImpl from "./channels/services/channel/pending-emails/service";
import { TabServiceImpl } from "./channels/services/tab";
import AuthServiceAPI from "../core/platform/services/auth/provider";
import { ConsoleServiceImpl } from "./console/service";
import { StatisticsServiceImpl } from "./statistics/service";
import { logger, TwakeServiceProvider } from "../core/platform/framework";
import assert from "assert";

type PlatformServices = {
  realtime: RealtimeServiceAPI;
  auth: AuthServiceAPI;
  search: SearchServiceAPI;
  storage: StorageAPI;
  pubsub: PubsubServiceAPI;
  counter: CounterAPI;
};

type CoreServices = {
  workspaces: WorkspaceService;
  companies: CompaniesServiceAPI;
  users: UsersService;
  console: ConsoleServiceAPI;
  statistics: StatisticsAPI;
  externalUser: UserExternalLinksService;
  notificationBadge: UserNotificationBadgeServiceAPI;
  notificationPreferences: UserNotificationPreferencesAPI;
  messages: MessageThreadMessagesServiceAPI;
  threads: MessageThreadsServiceAPI;
  userBookmarks: MessageUserBookmarksServiceAPI;
  applications: MarketplaceApplicationServiceAPI;
  companyApplications: CompanyApplicationServiceAPI;
  views: MessageViewsServiceAPI;
  messageEngine: MessagesEngine;
  files: FileServiceAPI;
  channels: ChannelService;
  members: MemberService;
  channelPendingEmail: ChannelPendingEmailService;
  tab: TabService;
};

class GlobalResolver {
  public platform: TwakePlatform;
  // public api: ApiContainer;
  public services: CoreServices;
  public platformServices: PlatformServices;
  public database: DatabaseServiceAPI;

  public fastify: FastifyInstance<Server, IncomingMessage, ServerResponse>;

  private alreadyInited = false;

  async doInit(platform: TwakePlatform) {
    if (this.alreadyInited) {
      return;
    }
    this.platform = platform;
    this.database = platform.getProvider<DatabaseServiceAPI>("database");
    const webserver = platform.getProvider<WebServerAPI>("webserver");
    const auth = platform.getProvider<AuthServiceAPI>("auth");
    const realtime = platform.getProvider<RealtimeServiceAPI>("realtime");

    this.fastify = webserver.getServer();

    this.platformServices = {
      realtime,
      auth,
      search: platform.getProvider<SearchServiceAPI>("search"),
      storage: platform.getProvider<StorageAPI>("storage"),
      pubsub: platform.getProvider<PubsubServiceAPI>("pubsub"),
      counter: platform.getProvider<CounterAPI>("counter"),
    };

    this.services = {
      workspaces: await new WorkspaceServiceImpl().init(),
      companies: await new CompanyServiceImpl().init(),
      users: await new UserServiceImpl().init(),
      console: await new ConsoleServiceImpl().init(),
      statistics: await new StatisticsServiceImpl().init(),
      externalUser: await new UserExternalLinksServiceImpl().init(),
      notificationBadge: await new UserNotificationBadgeService().init(platform),
      notificationPreferences: await new NotificationPreferencesService().init(),
      messages: await new ThreadMessagesService().init(platform),
      threads: await new ThreadsService().init(platform),
      userBookmarks: await new UserBookmarksService().init(platform),
      applications: await new ApplicationServiceImpl().init(),
      companyApplications: await new CompanyApplicationServiceImpl().init(),
      views: await new ViewsServiceImpl().init(platform),
      messageEngine: await new MessagesEngine().init(),
      files: await new FileServiceImpl().init(),
      channels: await new ChannelServiceImpl().init(),
      members: await new MemberServiceImpl().init(),
      channelPendingEmail: await new ChannelPendingEmailServiceImpl().init(),
      tab: await new TabServiceImpl().init(),
    };

    Object.keys(this.services).forEach((key: keyof CoreServices) => {
      assert(this.services[key], `Service ${key} was not initialized`);
    });

    logger.info("Global resolver finished initializing services");
    this.alreadyInited = true;
  }
}

export default new GlobalResolver();

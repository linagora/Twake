import WebServerAPI from "../../core/platform/services/webserver/provider";
import { TwakeService, Prefix, Consumes } from "../../core/platform/framework";
import { MessageServiceAPI } from "./api";
import { getService } from "./services/index";
import web from "./web/index";
import { DatabaseServiceAPI } from "../../core/platform/services/database/api";
import { PubsubServiceAPI } from "../../core/platform/services/pubsub/api";
import UserServiceAPI from "../user/api";
import ChannelServiceAPI from "../channels/provider";
import { FileServiceAPI } from "../files/api";
import { ApplicationServiceAPI } from "../applications/api";
import { StatisticsAPI } from "../../core/platform/services/statistics/types";
import { PlatformServicesAPI } from "../../core/platform/services/platform-services";

@Prefix("/internal/services/messages/v1")
@Consumes([
  "webserver",
  "database",
  "pubsub",
  "channels",
  "user",
  "files",
  "applications",
  "platform-services",
])
export default class MessageService extends TwakeService<MessageServiceAPI> {
  version = "1";
  name = "messages";
  service: MessageServiceAPI;

  api(): MessageServiceAPI {
    return this.service;
  }

  public async doInit(): Promise<this> {
    const fastify = this.context.getProvider<WebServerAPI>("webserver").getServer();
    const database = this.context.getProvider<DatabaseServiceAPI>("database");
    const pubsub = this.context.getProvider<PubsubServiceAPI>("pubsub");
    const user = this.context.getProvider<UserServiceAPI>("user");
    const channels = this.context.getProvider<ChannelServiceAPI>("channels");
    const files = this.context.getProvider<FileServiceAPI>("files");
    const applications = this.context.getProvider<ApplicationServiceAPI>("applications");
    const platformServices = this.context.getProvider<PlatformServicesAPI>("platform-services");

    this.service = getService(platformServices, user, channels, files, applications);
    await this.service?.init(this.context);

    fastify.register((instance, _opts, next) => {
      web(instance, { prefix: this.prefix, service: this.service });
      next();
    });

    return this;
  }
}

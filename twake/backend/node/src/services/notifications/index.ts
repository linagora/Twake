import WebServerAPI from "../../core/platform/services/webserver/provider";
import { TwakeService, Prefix, Consumes } from "../../core/platform/framework";
import { NotificationServiceAPI } from "./api";
import { getService } from "./services";
import web from "./web/index";
import { DatabaseServiceAPI } from "../../core/platform/services/database/api";
import { PubsubServiceAPI } from "../../core/platform/services/pubsub/api";
import UserServiceAPI from "../user/api";
import { PushServiceAPI } from "../../core/platform/services/push/api";

@Prefix("/internal/services/notifications/v1")
@Consumes(["webserver", "database", "pubsub", "user", "push"])
export default class NotificationService extends TwakeService<NotificationServiceAPI> {
  version = "1";
  name = "notifications";
  service: NotificationServiceAPI;
  user: UserServiceAPI;

  api(): NotificationServiceAPI {
    return this.service;
  }

  public async doInit(): Promise<this> {
    const fastify = this.context.getProvider<WebServerAPI>("webserver").getServer();
    const database = this.context.getProvider<DatabaseServiceAPI>("database");
    const pubsub = this.context.getProvider<PubsubServiceAPI>("pubsub");
    const push = this.context.getProvider<PushServiceAPI>("push");
    const user = await this.context.getProvider<UserServiceAPI>("user").init();

    this.service = getService(database, pubsub, push, user);
    await this.service?.init(this.context);

    fastify.register((instance, _opts, next) => {
      web(instance, { prefix: this.prefix, service: this.service });
      next();
    });

    return this;
  }
}

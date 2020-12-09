import WebServerAPI from "../../core/platform/services/webserver/provider";
import { TwakeService, Prefix, Consumes } from "../../core/platform/framework";
import { NotificationServiceAPI } from "./api";
import { getService } from "./services";
import web from "./web/index";
import { DatabaseServiceAPI } from "../../core/platform/services/database/api";
import { PubsubServiceAPI } from "../../core/platform/services/pubsub/api";
import { NotificationPubsubService } from "./pubsub";

@Prefix("/internal/services/notifications/v1")
@Consumes(["webserver", "database"])
export default class NotificationService extends TwakeService<NotificationServiceAPI> {
  version = "1";
  name = "notifications";
  service: NotificationServiceAPI;
  pubsub: NotificationPubsubService;

  api(): NotificationServiceAPI {
    return this.service;
  }

  public async doInit(): Promise<this> {
    const fastify = this.context.getProvider<WebServerAPI>("webserver").getServer();
    const database = this.context.getProvider<DatabaseServiceAPI>("database");

    this.service = getService(database);
    this.service.init && (await this.service.init());

    fastify.register((instance, _opts, next) => {
      web(instance, { prefix: this.prefix, service: this.service });
      next();
    });

    return this;
  }

  public async doStart(): Promise<this> {
    this.pubsub = new NotificationPubsubService(
      this.service,
      this.context.getProvider<PubsubServiceAPI>("pubsub"),
    );
    this.pubsub.subscribe();

    return this;
  }
}

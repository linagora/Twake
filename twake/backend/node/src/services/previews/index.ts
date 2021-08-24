import WebServerAPI from "../../core/platform/services/webserver/provider";
import { TwakeService, Prefix, Consumes } from "../../core/platform/framework";
import { DatabaseServiceAPI } from "../../core/platform/services/database/api";
import StorageAPI from "../../core/platform/services/storage/provider";
import { PubsubServiceAPI } from "../../core/platform/services/pubsub/api";
import { PreviewServiceAPI } from "./api";
import web from "./web/index";
import { getService } from "./services";

@Prefix("/internal/services/previews/v1")
@Consumes(["webserver", "database", "storage", "pubsub"])
export default class PreviewService extends TwakeService<PreviewServiceAPI> {
  version: "1";
  name: "previews";
  service: PreviewServiceAPI;

  api(): PreviewServiceAPI {
    return this.service;
  }

  public async doInit(): Promise<this> {
    const fastify = this.context.getProvider<WebServerAPI>("webserver").getServer();
    const database = this.context.getProvider<DatabaseServiceAPI>("database");
    const storage = this.context.getProvider<StorageAPI>("storage");
    const pubsub = this.context.getProvider<PubsubServiceAPI>("pubsub");

    this.service = getService(database, pubsub, storage);
    await this.service?.init(this.context);
    console.log(this.service, "------------------------------------------------");
    fastify.register((instance, _opts, next) => {
      web(instance, { prefix: this.prefix, service: this.service });
      next();
    });
    return this;
  }
}

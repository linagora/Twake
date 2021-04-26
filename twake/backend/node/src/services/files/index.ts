import WebServerAPI from "../../core/platform/services/webserver/provider";
import { TwakeService, Prefix, Consumes } from "../../core/platform/framework";
import { FileServiceAPI } from "./api";
import { getService } from "./services/index";
import web from "./web/index";
import { DatabaseServiceAPI } from "../../core/platform/services/database/api";
import { PubsubServiceAPI } from "../../core/platform/services/pubsub/api";
import StorageAPI from "../../../src/core/platform/services/storage/provider";

@Prefix("/internal/services/files/v1")
@Consumes(["webserver", "database", "storage", "pubsub"])
export default class FilesService extends TwakeService<FileServiceAPI> {
  version = "1";
  name = "files";
  service: FileServiceAPI;

  api(): FileServiceAPI {
    return this.service;
  }

  public async doInit(): Promise<this> {
    const fastify = this.context.getProvider<WebServerAPI>("webserver").getServer();
    const database = this.context.getProvider<DatabaseServiceAPI>("database");
    const storage = this.context.getProvider<StorageAPI>("storage");
    const pubsub = this.context.getProvider<PubsubServiceAPI>("pubsub");

    this.service = getService(database, pubsub, storage);
    await this.service?.init(this.context);

    fastify.register((instance, _opts, next) => {
      web(instance, { prefix: this.prefix, service: this.service });
      next();
    });

    return this;
  }
}

import WebServerAPI from "../../core/platform/services/webserver/provider";
import { TwakeService, Prefix, Consumes } from "../../core/platform/framework";
import ChannelServiceAPI from "./provider";
import { getService } from "./services";
import web from "./web/index";
import { DatabaseServiceAPI } from "../../core/platform/services/database/api";
import PhpNodeAPI from "../../core/platform/services/phpnode/provider";

@Prefix("/internal/services/channels/v1")
@Consumes(["webserver", "phpnode", "database"])
export default class ChannelService extends TwakeService<ChannelServiceAPI> {
  version = "1";
  name = "channels";
  service: ChannelServiceAPI;

  api(): ChannelServiceAPI {
    return this.service;
  }

  public async doInit(): Promise<this> {
    const phpnode = this.context.getProvider<PhpNodeAPI>("phpnode");
    const fastify = this.context.getProvider<WebServerAPI>("webserver").getServer();
    const database = this.context.getProvider<DatabaseServiceAPI>("database");

    this.service = getService(database);
    this.service.init && (await this.service.init());

    fastify.register((instance, _opts, next) => {
      web(instance, { prefix: this.prefix, service: this.service });
      next();
    });

    //TODO add routing to get channel appartenance
    /*phpnode.register(internalServer => {
      // Internal /private
      internalServer.route({
        method: "GET",
        url: `/private/companies/:company_id/workspaces/:workspace_id/channels/:channel_id/members/:member_id`,
        handler: () => {}, //membersController.get.bind(membersController),
      });
    });*/

    return this;
  }
}

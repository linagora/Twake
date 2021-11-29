import { Consumes, Prefix, TwakeService } from "../../core/platform/framework";
import ChannelServiceAPI from "./provider";
import { getService } from "./services";
import web from "./web/index";
import UserServiceAPI from "../user/api";
import { PlatformServicesAPI } from "../../core/platform/services/platform-services";

@Prefix("/internal/services/channels/v1")
@Consumes(["platform-services", "user"])
export default class ChannelService extends TwakeService<ChannelServiceAPI> {
  version = "1";
  name = "channels";
  service: ChannelServiceAPI;

  api(): ChannelServiceAPI {
    return this.service;
  }

  public async doInit(): Promise<this> {
    const platformServices = this.context.getProvider<PlatformServicesAPI>("platform-services");
    const fastify = platformServices.fastify.getServer();
    const user = this.context.getProvider<UserServiceAPI>("user");
    this.service = getService(platformServices, user);
    this.service.init && (await this.service.init());

    fastify.register((instance, _opts, next) => {
      web(instance, { prefix: this.prefix, service: this.service });
      next();
    });

    return this;
  }
}

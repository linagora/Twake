import { Prefix, TwakeService } from "../../core/platform/framework";
import WebServerAPI from "../../core/platform/services/webserver/provider";
import web from "./web/index";
import FastProxy from "fast-proxy";

@Prefix("/api")
export default class ApplicationsApiService extends TwakeService<undefined> {
  version = "1";
  name = "applicationsapi";

  public async doInit(): Promise<this> {
    const fastify = this.context.getProvider<WebServerAPI>("webserver").getServer();
    fastify.register((instance, _opts, next) => {
      web(instance, { prefix: this.prefix });
      next();
    });

    //Redirect requests from /plugins/* to the plugin server (if installed)
    const { proxy, close } = FastProxy({
      base: this.configuration.get("plugins.server"),
    });
    fastify.addHook("onClose", close);
    fastify.all("/plugins/*", (req, rep) => {
      proxy(req.raw, rep.raw, req.url, {});
    });

    return this;
  }

  // TODO: remove
  api(): undefined {
    return undefined;
  }
}

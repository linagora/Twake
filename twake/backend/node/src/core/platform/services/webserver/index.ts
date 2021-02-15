import { TwakeService } from "../../framework";
import { Server, IncomingMessage, ServerResponse } from "http";
import { FastifyInstance, fastify } from "fastify";
import sensible from "fastify-sensible";
import corsPlugin, { FastifyCorsOptions } from "fastify-cors";
import { serverErrorHandler } from "./error";
import WebServerAPI from "./provider";
import jwtPlugin from "../auth/web/jwt";
export default class WebServerService extends TwakeService<WebServerAPI> implements WebServerAPI {
  name = "webserver";
  version = "1";
  private server: FastifyInstance<Server, IncomingMessage, ServerResponse>;

  getServer(): FastifyInstance {
    return this.server;
  }

  api(): WebServerAPI {
    return this;
  }

  async doInit(): Promise<this> {
    // TODO: Get server config from options
    this.server = fastify({
      logger: {
        level: this.configuration.get<string>("logger.level", "debug"),
      },
    });

    serverErrorHandler(this.server);
    // DIRTY HACK: THis needs to be registered here to avoid circular dep between auth and user.
    // will have to create a core service for this, or another service which must be started first...
    this.server.register(jwtPlugin);
    this.server.register(sensible);
    this.server.register(corsPlugin, this.configuration.get<FastifyCorsOptions>("cors", {}));

    return this;
  }

  async doStart(): Promise<this> {
    try {
      await this.server.listen(this.configuration.get<number>("port", 3000), "0.0.0.0");

      return this;
    } catch (err) {
      this.server.log.error(err);
      throw err;
    }
  }

  async doStop(): Promise<this> {
    await this.server.close();

    return this;
  }
}

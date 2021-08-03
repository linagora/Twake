import { TwakeService } from "../../framework";
import { Server, IncomingMessage, ServerResponse } from "http";
import { FastifyInstance, fastify } from "fastify";
import sensible from "fastify-sensible";
import multipart from "fastify-multipart";
import formbody from "fastify-formbody";
import corsPlugin, { FastifyCorsOptions } from "fastify-cors";
import { serverErrorHandler } from "./error";
import WebServerAPI from "./provider";
import jwtPlugin from "../auth/web/jwt";
import swaggerPlugin from "fastify-swagger";
import { SkipCLI } from "../../framework/decorators/skip";
// import { throws } from "assert";
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
      maxParamLength: 300, //We have big urls with uuids and devices tokens
      logger: {
        level: this.configuration.get<string>("logger.level", "debug"),
      },
    });

    serverErrorHandler(this.server);
    // DIRTY HACK: THis needs to be registered here to avoid circular dep between auth and user.
    // will have to create a core service for this, or another service which must be started first...
    this.server.register(swaggerPlugin, {
      routePrefix: "/internal/docs",
      swagger: {
        info: {
          title: "Twake Swagger",
          description: "Automatically generate Twake Swagger API",
          version: "0.1.0",
        },
        externalDocs: {
          url: "http://doc.twake.app/",
          description: "Find more info here",
        },
        host: "localhost",
        schemes: ["http"],
        consumes: ["application/json"],
        produces: ["application/json"],
        tags: [],
        definitions: {},
        securityDefinitions: {},
      },
      uiConfig: {
        docExpansion: "full",
        deepLinking: false,
      },
      staticCSP: false,
      transformStaticCSP: header => header,
      exposeRoute: true,
    });
    this.server.register(jwtPlugin);
    this.server.register(sensible);
    this.server.register(multipart);
    this.server.register(formbody);
    this.server.register(corsPlugin, this.configuration.get<FastifyCorsOptions>("cors", {}));

    return this;
  }

  @SkipCLI()
  async doStart(): Promise<this> {
    try {
      await this.server.listen(this.configuration.get<number>("port", 3000), "0.0.0.0");

      this.server.ready(err => {
        if (err) throw err;
        this.server.swagger();
      });

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

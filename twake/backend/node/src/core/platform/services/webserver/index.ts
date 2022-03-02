import { logger, TwakeService } from "../../framework";
import { Server, IncomingMessage, ServerResponse } from "http";
import { FastifyInstance, fastify } from "fastify";
import sensible from "fastify-sensible";
import multipart from "fastify-multipart";
import formbody from "fastify-formbody";
import fastifyStatic from "fastify-static";
import corsPlugin, { FastifyCorsOptions } from "fastify-cors";
import { serverErrorHandler } from "./error";
import WebServerAPI from "./provider";
import jwtPlugin from "../auth/web/jwt";
import path from "path";
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
      logger: false,
    });

    this.server.addHook("onResponse", (req, reply, done) => {
      logger.info(`${reply.raw.statusCode} ${req.raw.method} ${req.raw.url}`);
      done();
    });

    this.server.addHook("onError", (request, reply, error, done) => {
      logger.error(error);
      done();
    });

    this.server.addHook("preValidation", (request, reply, done) => {
      if (reply.statusCode === 500) {
        logger.error("An error occured with the preValidation of ", request.routerPath);
      }
      done();
    });

    this.server.addHook("preHandler", (request, reply, done) => {
      if (reply.statusCode === 500) {
        logger.error("An error occured with the preHandler of ", request.routerPath);
      }
      done();
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
    this.server.register(sensible, { errorHandler: false });
    this.server.register(multipart);
    this.server.register(formbody);
    this.server.register(corsPlugin, this.configuration.get<FastifyCorsOptions>("cors", {}));

    let root = this.configuration.get<{ root: string }>("static", { root: "./public" }).root;
    root = root.indexOf("/") === 0 ? root : path.join(__dirname + "/../../../../../", root);
    this.server.register(fastifyStatic, {
      root,
    });
    this.server.setNotFoundHandler((request, reply) => {
      if (request.url.indexOf("/api") !== 0 && request.url.indexOf("/internal") !== 0) {
        reply.sendFile(root + "/index.html");
      } else {
        reply.status(404).send({});
      }
    });

    return this;
  }

  @SkipCLI()
  async doStart(): Promise<this> {
    try {
      console.log("Server start to listen NOW");

      await this.server.listen(this.configuration.get<number>("port", 3000), "0.0.0.0");

      this.server.ready(err => {
        console.log("Server was READY v2");
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

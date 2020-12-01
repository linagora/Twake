import { FastifyPluginCallback, FastifyReply, FastifyRequest } from "fastify";
import { FastifyInstance } from "fastify/types/instance";
import { IncomingMessage, Server, ServerResponse } from "http";
import { Consumes, TwakeService } from "../../framework";
import WebServerAPI from "../webserver/provider";
import PhpNodeAPI from "./provider";

@Consumes(["webserver"])
export default class WebServerService extends TwakeService<PhpNodeAPI> implements PhpNodeAPI {
  name = "phpnode";
  version = "1";
  private server: FastifyInstance<Server, IncomingMessage, ServerResponse>;

  api(): PhpNodeAPI {
    return this;
  }

  async accessControl(
    request: FastifyRequest,
    server: FastifyInstance<Server, IncomingMessage, ServerResponse>,
  ) {
    const token = (request.headers.authorization || "").trim().split("Token ").pop();
    const secret = this.configuration.get<string>("secret", "");
    let authorized = false;
    if (secret && token === secret) {
      authorized = true;
    }

    if (!authorized) {
      throw server.httpErrors.badRequest("Internal Access Refused");
    }
  }

  register(routes: FastifyPluginCallback) {
    this.server.register((instance, _opts, next) => {
      instance.register(routes, { prefix: "/private" });
      next();
    });
  }

  async doInit(): Promise<this> {
    this.server = this.context.getProvider<WebServerAPI>("webserver").getServer();
    return this;
  }
}

import { FastifyRequest, RouteHandlerMethod } from "fastify";
import { FastifyInstance } from "fastify/types/instance";
import { IncomingMessage, Server, ServerResponse } from "http";
import {
  ChannelCrudController,
  ChannelMemberCrudController,
} from "../../../../services/channels/web/controllers";
import {
  ChannelMemberParameters,
  ChannelParameters,
  CreateChannelBody,
} from "../../../../services/channels/web/types";
import ChannelServiceAPI from "../../../../services/channels/provider";
import { Consumes, TwakeService } from "../../framework";
import WebServerAPI from "../webserver/provider";
import WebSocketAPI from "../websocket/provider";
import PhpNodeAPI from "./provider";
import { RealtimeServiceAPI } from "../realtime/api";

@Consumes(["webserver", "websocket"])
export default class PhpNodeService extends TwakeService<PhpNodeAPI> implements PhpNodeAPI {
  name = "phpnode";
  version = "1";
  private server: FastifyInstance<Server, IncomingMessage, ServerResponse>;
  private ws: WebSocketAPI;
  private channels: ChannelServiceAPI;
  private realtime: RealtimeServiceAPI;

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

  register(paremeters: {
    method: "DELETE" | "GET" | "POST" | "PUT";
    url: string;
    handler: RouteHandlerMethod;
  }) {
    this.server.register((instance, _opts, next) => {
      instance.register(
        (internalServer, _, next) => {
          internalServer.route({
            method: paremeters.method,
            url: paremeters.url,
            preValidation: [request => this.accessControl(request, internalServer)],
            handler: paremeters.handler,
          });
          next();
        },
        { prefix: "/private" },
      );
      next();
    });
  }

  async doStart(): Promise<this> {
    this.channels = this.context.getProvider<ChannelServiceAPI>("channels");
    return this;
  }

  async doInit(): Promise<this> {
    this.server = this.context.getProvider<WebServerAPI>("webserver").getServer();
    this.ws = this.context.getProvider<WebSocketAPI>("websocket");
    this.realtime = this.context.getProvider<RealtimeServiceAPI>("realtime");

    /**
     * Register private calls from php for websockets
     */
    this.register({
      method: "POST",
      url: "/pusher",
      handler: (request, reply) => {
        const body = request.body as { room: string; data: any };
        const room = body.room;
        const data = body.data;
        this.ws.getIo().to(room).emit("realtime:event", { name: room, data: data });
        reply.send({});
      },
    });

    /**
     * Register private calls from php channels
     */
    this.register({
      method: "GET",
      url: "/companies/:company_id/workspaces/:workspace_id/channels/:id/members/:member_id/exists",
      handler: (request: FastifyRequest<{ Params: ChannelMemberParameters }>, reply) => {
        if (!this.channels) {
          reply.code(500).send(); //Server is not ready
          return;
        }
        const membersController = new ChannelMemberCrudController(
          this.realtime,
          this.channels.members,
        );
        membersController.exists(request, reply);
      },
    });

    /**
     * Register private calls from php channels
     */
    this.register({
      method: "GET",
      url: "/companies/:company_id/workspaces/:workspace_id/channels/:id",
      handler: (request: FastifyRequest<{ Params: ChannelParameters }>, reply) => {
        if (!this.channels) {
          reply.code(500).send(); //Server is not ready
          return;
        }
        const channelsController = new ChannelCrudController(
          this.realtime,
          this.channels.channels,
          this.channels.members,
          this.channels.pendingEmails,
        );
        channelsController.getForPHP(request, reply);
      },
    });

    /**
     * Register private calls from php channels
     */
    this.register({
      method: "POST",
      url: "/companies/:company_id/workspaces/:workspace_id/channels/defaultchannel",
      handler: (
        request: FastifyRequest<{
          Body: CreateChannelBody;
          Params: ChannelParameters;
          Querystring: { include_users: boolean };
        }>,
        reply,
      ) => {
        if (!this.channels) {
          reply.code(500).send(); //Server is not ready
          return;
        }
        const channelsController = new ChannelCrudController(
          this.realtime,
          this.channels.channels,
          this.channels.members,
          this.channels.pendingEmails,
        );
        request.currentUser = {
          id: (request.body as any).user_id,
        };
        channelsController.save(request, reply);
      },
    });

    return this;
  }
}

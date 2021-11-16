import { FastifyReply, FastifyRequest } from "fastify";
import SocketIO from "socket.io";
import { User } from "../utils/types";

export interface authenticateDecorator {
  (request: FastifyRequest): FastifyRequest;
  (reply: FastifyReply): FastifyReply;
}

declare module "fastify" {
  interface FastifyInstance {
    phpnodeAuthenticate(): void;
    authenticate(): void;
    authenticateOptional(): void;
    io: SocketIO.Server;
  }

  interface FastifyRequest {
    currentUser: User;
  }
}

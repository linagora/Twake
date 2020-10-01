import { FastifyReply, FastifyRequest } from "fastify";
import SocketIO from "socket.io";

export interface authenticateDecorator {
  (request: FastifyRequest): FastifyRequest,
  (reply: FastifyReply): FastifyReply
 }

declare module "fastify" {
  interface FastifyInstance {
    authenticate(): void;
    io: SocketIO.Server;
  }
}

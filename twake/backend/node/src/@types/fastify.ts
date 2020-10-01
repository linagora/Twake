import { FastifyReply, FastifyRequest } from "fastify";

export interface authenticateDecorator {
  (request: FastifyRequest): FastifyRequest,
  (reply: FastifyReply): FastifyReply
 }

declare module "fastify" {
  interface FastifyInstance {
    authenticate(): void;
  }
}

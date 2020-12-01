import { FastifyInstance, FastifyPluginCallback, FastifyRequest } from "fastify";
import { IncomingMessage, ServerResponse, Server } from "http";
import { TwakeServiceProvider } from "../../framework";

export default interface PhpNodeAPI extends TwakeServiceProvider {
  accessControl(
    request: FastifyRequest,
    server: FastifyInstance<Server, IncomingMessage, ServerResponse>,
  ): Promise<void>;
  register(routes: FastifyPluginCallback): void;
}

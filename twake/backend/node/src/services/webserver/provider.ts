import { Server, IncomingMessage, ServerResponse } from "http";
import { FastifyInstance } from "fastify";
import { TwakeServiceProvider } from "../../core/platform/api";

export default interface WebServerAPI extends TwakeServiceProvider {
  /**
   * Get the fastify webserver instance
   */
  getServer(): FastifyInstance<Server, IncomingMessage, ServerResponse>;
}

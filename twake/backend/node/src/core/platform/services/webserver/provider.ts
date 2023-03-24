import { Server, IncomingMessage, ServerResponse } from "http";
import { FastifyInstance } from "fastify";
import { TwakeServiceProvider } from "../../framework/api";

export default interface WebServerAPI extends TwakeServiceProvider {
  /**
   * Get the fastify webserver instance
   */
  getServer(): FastifyInstance<Server, IncomingMessage, ServerResponse>;

  // eslint-disable-next-line @typescript-eslint/ban-types
  onReady(handler: Function): void;
}

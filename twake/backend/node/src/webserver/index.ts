import { Server, IncomingMessage, ServerResponse } from "http";
import * as fastify from "fastify";
import { serverErrorHandler } from "./error";
import { registerRoutes } from "./api";
import config from "../core/config";

const server: fastify.FastifyInstance<Server, IncomingMessage, ServerResponse> = fastify.fastify({
  logger: true
});

serverErrorHandler(server);
registerRoutes(server);

const start = async (): Promise<void> => {
  try {
    await server.listen(config.get("web.port"), "0.0.0.0");
  } catch (err) {
    server.log.error(err);
    process.exit(1);
  }
};

process.on("uncaughtException", error => {
  console.error(error);
});

process.on("unhandledRejection", error => {
  console.error(error);
});

export default start;

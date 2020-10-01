import { Server, IncomingMessage, ServerResponse } from "http";
import { FastifyInstance, fastify } from "fastify";
import { serverErrorHandler } from "./error";
import { registerRoutes } from "./api";
import { configureAuthentication } from "./auth";
import config from "../core/config";

const server: FastifyInstance<Server, IncomingMessage, ServerResponse> = fastify({
  logger: true
});

serverErrorHandler(server);
configureAuthentication(server);
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

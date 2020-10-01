import { Server, IncomingMessage, ServerResponse } from "http";
import * as fastify from "fastify";
import { registerRoutes } from "./api";

const server: fastify.FastifyInstance<Server, IncomingMessage, ServerResponse> = fastify.fastify({
  logger: true
});

server.setErrorHandler(async (err) => {
  console.log(err);
});

registerRoutes(server);

const start = async (): Promise<void> => {
  try {
    await server.listen(4000, "0.0.0.0");
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

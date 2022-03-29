import { FastifyInstance, FastifyRegisterOptions } from "fastify";
import { ConsoleServiceAPI } from "../api";
import routes from "./routes";
import { ConsoleOptions } from "../types";

export default (
  fastify: FastifyInstance,
  options: FastifyRegisterOptions<{
    prefix: string;
  }>,
): void => {
  fastify.log.debug("Configuring /console routes");
  fastify.register(routes, options);
};

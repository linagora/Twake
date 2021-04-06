import { FastifyInstance, FastifyRegisterOptions } from "fastify";
import { MessageServiceAPI } from "../api";
import routes from "./routes";

export default (
  fastify: FastifyInstance,
  options: FastifyRegisterOptions<{ prefix: string; service: MessageServiceAPI }>,
): void => {
  fastify.log.debug("Configuring /internal/services/messages/v1 routes");
  fastify.register(routes, options);
};

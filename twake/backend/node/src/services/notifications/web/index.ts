import { FastifyInstance, FastifyRegisterOptions } from "fastify";
import { NotificationServiceAPI } from "../api";
import routes from "./routes";

export default (
  fastify: FastifyInstance,
  options: FastifyRegisterOptions<{ prefix: string; service: NotificationServiceAPI }>,
): void => {
  fastify.log.info("Configuring /internal/services/notifications/v1 routes");
  fastify.register(routes, options);
};

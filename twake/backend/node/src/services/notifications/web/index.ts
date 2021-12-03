import { FastifyInstance, FastifyRegisterOptions } from "fastify";
import { RealtimeServiceAPI } from "../../../core/platform/services/realtime/api";
import { NotificationServiceAPI } from "../api";
import routes from "./routes";

export default (
  fastify: FastifyInstance,
  options: FastifyRegisterOptions<{
    prefix: string;
    service: NotificationServiceAPI;
    realtime: RealtimeServiceAPI;
  }>,
): void => {
  fastify.log.debug("Configuring /internal/services/notifications/v1 routes");
  fastify.register(routes, options);
};

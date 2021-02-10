import { FastifyInstance, FastifyPluginCallback } from "fastify";
import { NotificationController } from "./controllers";
import { NotificationServiceAPI } from "../api";

const badgesUrl = "/badges";

const routes: FastifyPluginCallback<{ service: NotificationServiceAPI }> = (
  fastify: FastifyInstance,
  options,
  next,
) => {
  const notificationController = new NotificationController(options.service);

  fastify.route({
    method: "GET",
    url: badgesUrl,
    preValidation: [fastify.authenticate],
    handler: notificationController.list.bind(notificationController),
  });

  next();
};

export default routes;

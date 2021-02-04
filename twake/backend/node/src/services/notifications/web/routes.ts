import { FastifyInstance, FastifyPluginCallback } from "fastify";
import { NotificationController, NotificationPrerencesController } from "./controllers";
import { NotificationServiceAPI } from "../api";
import { createNotificationPreferencesSchema } from "./schemas";

const badgesUrl = "/badges";
const notificationPreferencesUrl = "/preferences";

const routes: FastifyPluginCallback<{ service: NotificationServiceAPI }> = (
  fastify: FastifyInstance,
  options,
  next,
) => {
  const notificationController = new NotificationController(options.service);
  const notificationPrerencesController = new NotificationPrerencesController(options.service);

  fastify.route({
    method: "GET",
    url: badgesUrl,
    preValidation: [fastify.authenticate],
    handler: notificationController.list.bind(notificationController),
  });

  fastify.route({
    method: "GET",
    url: notificationPreferencesUrl,
    preValidation: [fastify.authenticate],
    handler: notificationPrerencesController.list.bind(notificationPrerencesController),
  });

  fastify.route({
    method: "POST",
    url: notificationPreferencesUrl,
    preValidation: [fastify.authenticate],
    schema: createNotificationPreferencesSchema,
    handler: notificationPrerencesController.save.bind(notificationPrerencesController),
  });

  next();
};

export default routes;

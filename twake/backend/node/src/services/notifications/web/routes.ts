import { FastifyInstance, FastifyPluginCallback } from "fastify";
import { NotificationController, NotificationPreferencesController } from "./controllers";
import { createNotificationPreferencesSchema } from "./schemas";

const badgesUrl = "/badges";
const notificationPreferencesUrl = "/preferences";

const routes: FastifyPluginCallback = (fastify: FastifyInstance, options, next) => {
  const notificationController = new NotificationController();
  const notificationPreferencesController = new NotificationPreferencesController();

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
    handler: notificationPreferencesController.list.bind(notificationPreferencesController),
  });

  fastify.route({
    method: "POST",
    url: notificationPreferencesUrl,
    preValidation: [fastify.authenticate],
    schema: createNotificationPreferencesSchema,
    handler: notificationPreferencesController.save.bind(notificationPreferencesController),
  });

  fastify.route({
    method: "POST",
    url: `${badgesUrl}/:company_id/:notification_id/acknowledge`,
    preValidation: [fastify.authenticate],
    handler: notificationController.acknowledge.bind(notificationController),
  });

  next();
};

export default routes;

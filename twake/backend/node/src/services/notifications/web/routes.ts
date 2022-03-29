import { FastifyInstance, FastifyPluginCallback } from "fastify";
import { NotificationController, NotificationPrerencesController } from "./controllers";
import { NotificationServiceAPI } from "../api";
import { createNotificationPreferencesSchema } from "./schemas";
import { RealtimeServiceAPI } from "../../../core/platform/services/realtime/api";

const badgesUrl = "/badges";
const notificationPreferencesUrl = "/preferences";

const routes: FastifyPluginCallback = (fastify: FastifyInstance, options, next) => {
  const notificationController = new NotificationController();
  const notificationPreferencesController = new NotificationPrerencesController();

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

  next();
};

export default routes;

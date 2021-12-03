import { FastifyInstance, FastifyPluginCallback } from "fastify";
import { NotificationController, NotificationPrerencesController } from "./controllers";
import { NotificationServiceAPI } from "../api";
import { createNotificationPreferencesSchema } from "./schemas";
import { RealtimeServiceAPI } from "../../../core/platform/services/realtime/api";

const badgesUrl = "/badges";
const notificationPreferencesUrl = "/preferences";

const routes: FastifyPluginCallback<{
  service: NotificationServiceAPI;
  realtime: RealtimeServiceAPI;
}> = (fastify: FastifyInstance, options, next) => {
  const notificationController = new NotificationController(options.realtime, options.service);
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

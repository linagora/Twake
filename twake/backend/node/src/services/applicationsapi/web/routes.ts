import { FastifyInstance, FastifyPluginCallback } from "fastify";
import { ApplicationsApiServiceAPI } from "../api";
import { ApplicationsApiController } from "./controllers";

const routes: FastifyPluginCallback<{ service: ApplicationsApiServiceAPI }> = (
  fastify: FastifyInstance,
  options,
  next,
) => {
  const controller = new ApplicationsApiController(options.service);

  //Authenticate the application
  fastify.route({
    method: "POST",
    url: `console/v1/login`,
    handler: controller.token.bind(controller),
  });

  //Get myself as an application
  fastify.route({
    method: "POST",
    url: `console/v1/me`,
    preValidation: [fastify.authenticate],
    handler: controller.me.bind(controller),
  });

  //Open a configuration popup on the client side
  fastify.route({
    method: "POST",
    url: `console/v1/configure`,
    preValidation: [fastify.authenticate],
    handler: controller.configure.bind(controller),
  });

  //Close a configuration popup on the client side
  fastify.route({
    method: "DELETE",
    url: `console/v1/configure/:configuration_id`,
    preValidation: [fastify.authenticate],
    handler: controller.closeConfigure.bind(controller),
  });

  //Close a configuration popup on the client side
  fastify.route({
    method: "DELETE",
    url: `console/v1/configure/:configuration_id`,
    preValidation: [fastify.authenticate],
    handler: controller.closeConfigure.bind(controller),
  });

  //Get myself as an application
  fastify.route({
    method: "POST",
    url: `*`, //Fixme probably not working that way
    preValidation: [fastify.authenticate],
    handler: (request, reply) => controller.proxy.bind(controller)(request, reply, fastify),
  });

  next();
};

export default routes;

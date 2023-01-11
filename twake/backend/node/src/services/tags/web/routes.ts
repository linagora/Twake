import { FastifyInstance, FastifyPluginCallback } from "fastify";
import { TagsController } from "./controllers";

const tagsUrl = "/companies/:company_id/tags";

const routes: FastifyPluginCallback = (fastify: FastifyInstance, options, next) => {
  const tagsController = new TagsController();

  fastify.route({
    method: "GET",
    url: `${tagsUrl}/:tag_id`,
    preValidation: [fastify.authenticate],
    handler: tagsController.get.bind(tagsController),
  });

  fastify.route({
    method: "GET",
    url: tagsUrl,
    preValidation: [fastify.authenticate],
    handler: tagsController.list.bind(tagsController),
  });

  fastify.route({
    method: "POST",
    url: tagsUrl,
    preValidation: [fastify.authenticate],
    handler: tagsController.save.bind(tagsController),
  });

  fastify.route({
    method: "POST",
    url: `${tagsUrl}/:tag_id`,
    preValidation: [fastify.authenticate],
    handler: tagsController.update.bind(tagsController),
  });

  fastify.route({
    method: "DELETE",
    url: `${tagsUrl}/:tag_id`,
    preValidation: [fastify.authenticate],
    handler: tagsController.delete.bind(tagsController),
  });

  next();
};

export default routes;

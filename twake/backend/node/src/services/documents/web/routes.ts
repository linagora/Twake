import { FastifyInstance, FastifyPluginCallback } from "fastify";
import { DocumentsController } from "./controllers";
import { createDocumentSchema, createVersionSchema } from "./schemas";

const serviceUrl = "/companies/:company_id/item";

const routes: FastifyPluginCallback = (fastify: FastifyInstance, _options, next) => {
  const documentsController = new DocumentsController();

  fastify.route({
    method: "GET",
    url: `${serviceUrl}`,
    preValidation: [fastify.authenticate],
    handler: documentsController.listRootFolder.bind(documentsController),
  });

  fastify.route({
    method: "GET",
    url: `${serviceUrl}/:id`,
    preValidation: [fastify.authenticate],
    handler: documentsController.get.bind(documentsController),
  });

  fastify.route({
    method: "POST",
    url: serviceUrl,
    preValidation: [fastify.authenticate],
    schema: createDocumentSchema,
    handler: documentsController.create.bind(documentsController),
  });

  fastify.route({
    method: "POST",
    url: `${serviceUrl}/:id`,
    preValidation: [fastify.authenticate],
    handler: documentsController.update.bind(documentsController),
  });

  fastify.route({
    method: "DELETE",
    url: `${serviceUrl}/:id`,
    preValidation: [fastify.authenticate],
    handler: documentsController.delete.bind(documentsController),
  });

  fastify.route({
    method: "POST",
    url: `${serviceUrl}/:id/version`,
    preValidation: [fastify.authenticate],
    schema: createVersionSchema,
    handler: documentsController.createVersion.bind(documentsController),
  });

  fastify.route({
    method: "GET",
    url: `${serviceUrl}/:id/download`,
    preValidation: [fastify.authenticate],
    handler: documentsController.download.bind(documentsController),
  });

  fastify.route({
    method: "GET",
    url: `${serviceUrl}/download/zip`,
    preValidation: [fastify.authenticate],
    handler: documentsController.downloadZip.bind(documentsController),
  });

  return next();
};

export default routes;

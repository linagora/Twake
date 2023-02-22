import { FastifyInstance, FastifyPluginCallback } from "fastify";
import { DocumentsController } from "./controllers";
import { createDocumentSchema, createVersionSchema } from "./schemas";

const baseUrl = "/companies/:company_id";
const serviceUrl = `${baseUrl}/item`;

const routes: FastifyPluginCallback = (fastify: FastifyInstance, _options, next) => {
  const documentsController = new DocumentsController();

  fastify.route({
    method: "GET",
    url: `${serviceUrl}`,
    preValidation: [fastify.authenticateOptional],
    handler: documentsController.listRootFolder.bind(documentsController),
  });

  fastify.route({
    method: "GET",
    url: `${serviceUrl}/:id`,
    preValidation: [fastify.authenticateOptional],
    handler: documentsController.get.bind(documentsController),
  });

  fastify.route({
    method: "POST",
    url: serviceUrl,
    preValidation: [fastify.authenticateOptional],
    schema: createDocumentSchema,
    handler: documentsController.create.bind(documentsController),
  });

  fastify.route({
    method: "POST",
    url: `${serviceUrl}/:id`,
    preValidation: [fastify.authenticateOptional],
    handler: documentsController.update.bind(documentsController),
  });

  fastify.route({
    method: "DELETE",
    url: `${serviceUrl}/:id`,
    preValidation: [fastify.authenticateOptional],
    handler: documentsController.delete.bind(documentsController),
  });

  fastify.route({
    method: "POST",
    url: `${serviceUrl}/:id/version`,
    preValidation: [fastify.authenticateOptional],
    schema: createVersionSchema,
    handler: documentsController.createVersion.bind(documentsController),
  });

  fastify.route({
    method: "GET",
    url: `${serviceUrl}/download/token`,
    preValidation: [fastify.authenticateOptional],
    handler: documentsController.downloadGetToken.bind(documentsController),
  });

  fastify.route({
    method: "GET",
    url: `${serviceUrl}/:id/download`,
    preValidation: [fastify.authenticateOptional],
    handler: documentsController.download.bind(documentsController),
  });

  fastify.route({
    method: "GET",
    url: `${serviceUrl}/download/zip`,
    preValidation: [fastify.authenticateOptional],
    handler: documentsController.downloadZip.bind(documentsController),
  });

  fastify.route({
    method: "POST",
    url: `${baseUrl}/search`,
    preValidation: [fastify.authenticate],
    handler: documentsController.search.bind(documentsController),
  });

  fastify.route({
    method: "GET",
    url: `${baseUrl}/tabs/:tab_id`,
    preValidation: [fastify.authenticate],
    handler: documentsController.getTab.bind(documentsController),
  });

  fastify.route({
    method: "POST",
    url: `${baseUrl}/tabs/:tab_id`,
    preValidation: [fastify.authenticate],
    handler: documentsController.setTab.bind(documentsController),
  });

  return next();
};

export default routes;

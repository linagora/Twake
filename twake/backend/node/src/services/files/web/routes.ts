import { FastifyInstance, FastifyPluginCallback } from "fastify";
import { FileController } from "./controllers/files";

const filesUrl = "/files";

const routes: FastifyPluginCallback<{ service: any }> = (
  fastify: FastifyInstance,
  options,
  next,
) => {
  const fileController = new FileController(options.service);

  fastify.route({
    method: "POST",
    url: `${filesUrl}/:upload`,
    preValidation: true ? [] : [fastify.authenticate],
    handler: fileController.save.bind(fileController),
  });

  fastify.route({
    method: "DELETE",
    url: `${filesUrl}/:id`,
    preValidation: true ? [] : [fastify.authenticate],
    handler: fileController.delete.bind(fileController),
  });

  next();
};

export default routes;

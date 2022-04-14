import { FastifyInstance, FastifyPluginCallback } from "fastify";
import { PreviewController } from "./controllers/previews";

const previewsUrl = "/previews";

const routes: FastifyPluginCallback = (fastify: FastifyInstance, options, next) => {
  const previewController = new PreviewController();

  next();
};

export default routes;

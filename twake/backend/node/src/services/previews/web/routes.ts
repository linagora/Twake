import { FastifyInstance, FastifyPluginCallback } from "fastify";
import { PreviewServiceAPI } from "../api";
import { PreviewController } from "./controllers/previews";

const previewsUrl = "/previews";

const routes: FastifyPluginCallback<{ service: PreviewServiceAPI }> = (
  fastify: FastifyInstance,
  options,
  next,
) => {
  const previewController = new PreviewController(options.service);

  next();
};

export default routes;

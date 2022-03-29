import { FastifyInstance, FastifyPluginCallback } from "fastify";
import { PreviewServiceAPI } from "../api";
import { PreviewController } from "./controllers/previews";

const previewsUrl = "/previews";

const routes: FastifyPluginCallback = (fastify: FastifyInstance, options, next) => {
  const previewController = new PreviewController();

  next();
};

export default routes;

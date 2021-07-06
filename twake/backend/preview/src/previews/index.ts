import { PreviewServiceAPI } from "./api";
import web from "./web/index";
import { FastifyInstance } from "fastify";

export default class PreviewService {
  version: 1;
  names: "preview";
  service: PreviewServiceAPI;

  api(): PreviewServiceAPI {
    return this.service;
  }

  public async init(fastify: FastifyInstance): Promise<this> {
    fastify.register((instance, _opts, next) => {
      web(instance, { prefix: "/", service: this.service });
      next();
    });

    return this;
  }
}

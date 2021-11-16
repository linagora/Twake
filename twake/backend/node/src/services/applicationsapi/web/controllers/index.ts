import { FastifyReply, FastifyRequest, FastifyInstance, HTTPMethods } from "fastify";
import { ApplicationsApiServiceAPI } from "../../api";

export class ApplicationsApiController {
  constructor(readonly applicationsApiService: ApplicationsApiServiceAPI) {}

  async token(request: FastifyRequest<{}>, reply: FastifyReply) {
    return { error: "Not implemented (yet)" };
  }

  async me(request: FastifyRequest<{}>, reply: FastifyReply) {
    return { error: "Not implemented (yet)" };
  }

  async configure(request: FastifyRequest<{}>, reply: FastifyReply) {
    return { error: "Not implemented (yet)" };
  }

  async closeConfigure(
    request: FastifyRequest<{ Params: { configuration_id: string } }>,
    reply: FastifyReply,
  ) {
    return { error: "Not implemented (yet)" };
  }

  async proxy(request: FastifyRequest<{}>, reply: FastifyReply, fastify: FastifyInstance) {
    //TODO Check application access rights (write, read, remove for each micro services)

    //TODO save some statistics about API usage

    const route = request.url.replace("/api/", "/internal/services/");

    fastify.inject(
      {
        method: request.method as HTTPMethods,
        url: route,
      },
      (err, response) => {
        reply.headers(response.headers);
        reply.send(response.payload);
      },
    );
  }
}

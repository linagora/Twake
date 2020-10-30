import { FastifyInstance } from "fastify";

function serverErrorHandler(server: FastifyInstance): void {
  server.setErrorHandler(async err => {
    server.log.debug(err);

    return err;
  });
}

export { serverErrorHandler };

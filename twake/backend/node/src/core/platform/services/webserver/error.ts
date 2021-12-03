import { FastifyInstance } from "fastify";

function serverErrorHandler(server: FastifyInstance): void {
  server.setErrorHandler(async (err, request, reply) => {
    server.log.debug(err.toString());
    await reply.status(500).send(err);
  });
}

export { serverErrorHandler };

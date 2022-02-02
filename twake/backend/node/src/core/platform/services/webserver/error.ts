import { FastifyInstance } from "fastify";

function serverErrorHandler(server: FastifyInstance): void {
  server.setErrorHandler(async (err, request, reply) => {
    console.error(`Got 500 error on request ${request.id} : `, err);
    server.log.debug(`Got 500 error on request ${request.id} : ${err.toString()}`);
    await reply.status(500).send({
      statusCode: 500,
      error: "Internal Server Error",
      message: "Something went wrong",
      requestId: request.id,
    });
  });
}

export { serverErrorHandler };

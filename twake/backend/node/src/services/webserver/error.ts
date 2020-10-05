import { FastifyInstance } from "fastify";

function serverErrorHandler(server: FastifyInstance): void {
  server.setErrorHandler(async (err) => {
    console.log(err);
  });
}

export {
  serverErrorHandler
};

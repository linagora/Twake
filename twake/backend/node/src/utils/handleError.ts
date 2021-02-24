import { FastifyReply } from "fastify";
import { HttpErrorCodes } from "fastify-sensible/lib/httpError";
import { CrudExeption } from "../core/platform/framework/api/crud-service";

export function handleError(reply: FastifyReply, err: Error): void {
  if (err instanceof CrudExeption) {
    const crudException: CrudExeption = err;
    reply.getHttpError(crudException.status as HttpErrorCodes, crudException.message);
  } else {
    throw err;
  }
}

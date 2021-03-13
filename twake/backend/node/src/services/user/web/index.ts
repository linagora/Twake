import { FastifyInstance, FastifyRegisterOptions } from "fastify";
import UserServiceAPI from "../api";
import routes from "./routes";

export default (
  fastify: FastifyInstance,
  options: FastifyRegisterOptions<{ prefix: string, service: UserServiceAPI }>,
): void => {
  fastify.log.info("Configuring /users routes");
  fastify.register(routes, options);
};

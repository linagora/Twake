import { FastifyInstance } from "fastify";
import users from './users';

export function registerRoutes(fastify: FastifyInstance) {
  users(fastify);
};

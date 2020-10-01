import { FastifyInstance, FastifyPluginCallback, RouteShorthandOptions } from "fastify";
import { MessageParams, CreateMessageBody } from "./types";
import * as controller from "./controller";
import Message from "../../../core/types/message";

const routes: FastifyPluginCallback = (fastify: FastifyInstance, _opts, next) => {
  fastify.get("/", async (req): Promise<Message[]> => {
    req.log.info("Get messages");

    return controller.getMessages();
  });

  fastify.get<{
    Params: MessageParams,
  }>("/:id", async (req): Promise<Message> => {
    req.log.info(`Get user ${req.params.id}`);
    return controller.getMessage(req.params.id);
  });

  const createOptions: RouteShorthandOptions = {
    schema: {
      body: {
        type: "object",
        properties: {
          creator: {
            type: "string",
          },
          text: {
            type: "string"
          }
        }
      }
    }
  };

  fastify.post<{
    Body: CreateMessageBody
  }>("/", createOptions, async (req): Promise<Message> => {
    req.log.info(`Creating message ${JSON.stringify(req.body)}`);
    return new Message("1");
  });

  next();
};

export default routes;
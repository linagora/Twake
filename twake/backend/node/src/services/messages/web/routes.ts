import { FastifyInstance, FastifyPluginCallback } from "fastify";
import { MessageServiceAPI } from "../api";
import {
  ThreadsController,
  MessagesController,
  UserBookmarksController,
  ViewsController,
} from "./controllers";

const routes: FastifyPluginCallback<{ service: MessageServiceAPI }> = (
  fastify: FastifyInstance,
  options,
  next,
) => {
  const threadsController = new ThreadsController(options.service);
  const messagesController = new MessagesController(options.service);
  const userBookmarksController = new UserBookmarksController(options.service);
  const viewsController = new ViewsController(options.service);

  /**
   * In threads message collection
   */
  fastify.route({
    method: "POST",
    url: "/companies/:company_id/threads/:thread_id/messages",
    preValidation: true ? [] : [fastify.authenticate],
    handler: messagesController.save.bind(messagesController),
  });

  fastify.route({
    method: "POST",
    url: "/companies/:company_id/threads/:thread_id/messages/:message_id",
    preValidation: true ? [] : [fastify.authenticate],
    handler: messagesController.save.bind(messagesController),
  });

  fastify.route({
    method: "GET",
    url: "/companies/:company_id/threads/:thread_id/messages",
    preValidation: true ? [] : [fastify.authenticate],
    handler: messagesController.list.bind(messagesController),
  });

  fastify.route({
    method: "POST",
    url: "/companies/:company_id/threads/:thread_id/messages/:message_id/reaction",
    preValidation: true ? [] : [fastify.authenticate],
    handler: messagesController.reaction.bind(messagesController),
  });

  fastify.route({
    method: "POST",
    url: "/companies/:company_id/threads/:thread_id/messages/:message_id/bookmark",
    preValidation: true ? [] : [fastify.authenticate],
    handler: messagesController.bookmark.bind(messagesController),
  });

  fastify.route({
    method: "POST",
    url: "/companies/:company_id/threads/:thread_id/messages/:message_id/pin",
    preValidation: true ? [] : [fastify.authenticate],
    handler: messagesController.pin.bind(messagesController),
  });

  /**
   * User bookmarks collection
   */
  fastify.route({
    method: "GET",
    url: "/preferences/bookmarks",
    preValidation: true ? [] : [fastify.authenticate],
    handler: userBookmarksController.save.bind(userBookmarksController),
  });

  fastify.route({
    method: "POST",
    url: "/preferences/bookmarks",
    preValidation: true ? [] : [fastify.authenticate],
    handler: userBookmarksController.save.bind(userBookmarksController),
  });

  fastify.route({
    method: "DELETE",
    url: "/preferences/bookmarks/:name",
    preValidation: true ? [] : [fastify.authenticate],
    handler: userBookmarksController.save.bind(userBookmarksController),
  });

  /**
   * Threads creation route
   */
  fastify.route({
    method: "POST",
    url: "/companies/:company_id/threads",
    preValidation: true ? [] : [fastify.authenticate],
    handler: threadsController.save.bind(threadsController),
  });

  /**
   * Views routes
   */
  fastify.route({
    method: "GET",
    url: "/companies/:company_id/workspaces/:workspace_id/channels/:channel_id/feed",
    preValidation: true ? [] : [fastify.authenticate],
    handler: viewsController.list.bind(viewsController),
  });

  fastify.route({
    method: "GET",
    url: "/companies/:company_id/workspaces/:workspace_id/channels/:channel_id/filtered/:filter",
    preValidation: true ? [] : [fastify.authenticate],
    handler: viewsController.list.bind(viewsController),
  });

  fastify.route({
    method: "GET",
    url: "/companies/:company_id/files",
    preValidation: true ? [] : [fastify.authenticate],
    handler: viewsController.listFiles.bind(viewsController),
  });

  fastify.route({
    method: "GET",
    url: "/companies/:company_id/bookmarks",
    preValidation: true ? [] : [fastify.authenticate],
    handler: viewsController.list.bind(viewsController),
  });

  fastify.route({
    method: "GET",
    url: "/companies/:company_id/inbox",
    preValidation: true ? [] : [fastify.authenticate],
    handler: viewsController.list.bind(viewsController),
  });

  next();
};

export default routes;

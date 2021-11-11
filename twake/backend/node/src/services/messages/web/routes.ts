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
   * User bookmarks collection
   */
  fastify.route({
    method: "GET",
    url: "/companies/:company_id/preferences/bookmarks",
    preValidation: [fastify.authenticate],
    handler: userBookmarksController.list.bind(userBookmarksController),
  });

  fastify.route({
    method: "POST",
    url: "/companies/:company_id/preferences/bookmarks/:id",
    preValidation: [fastify.authenticate],
    handler: userBookmarksController.save.bind(userBookmarksController),
  });

  fastify.route({
    method: "POST",
    url: "/companies/:company_id/preferences/bookmarks",
    preValidation: [fastify.authenticate],
    handler: userBookmarksController.save.bind(userBookmarksController),
  });

  fastify.route({
    method: "DELETE",
    url: "/companies/:company_id/preferences/bookmarks/:id",
    preValidation: [fastify.authenticate],
    handler: userBookmarksController.delete.bind(userBookmarksController),
  });

  /**
   * Threads creation route
   */
  fastify.route({
    method: "POST",
    url: "/companies/:company_id/threads",
    preValidation: [fastify.authenticate],
    handler: threadsController.save.bind(threadsController),
  });

  fastify.route({
    method: "POST",
    url: "/companies/:company_id/threads/:thread_id",
    preValidation: [fastify.authenticate],
    handler: threadsController.save.bind(threadsController),
  });

  /**
   * In threads message collection
   */
  fastify.route({
    method: "POST",
    url: "/companies/:company_id/threads/:thread_id/messages",
    preValidation: [fastify.authenticate],
    handler: messagesController.save.bind(messagesController),
  });

  fastify.route({
    method: "POST",
    url: "/companies/:company_id/threads/:thread_id/messages/:message_id",
    preValidation: [fastify.authenticate],
    handler: messagesController.save.bind(messagesController),
  });

  fastify.route({
    method: "GET",
    url: "/companies/:company_id/threads/:thread_id/messages/:message_id",
    preValidation: [fastify.authenticate],
    handler: messagesController.get.bind(messagesController),
  });

  fastify.route({
    method: "GET",
    url: "/companies/:company_id/threads/:thread_id/messages",
    preValidation: [fastify.authenticate],
    handler: messagesController.list.bind(messagesController),
  });

  fastify.route({
    method: "DELETE",
    url: "/companies/:company_id/threads/:thread_id/messages/:message_id",
    preValidation: [fastify.authenticate],
    handler: messagesController.forceDelete.bind(messagesController),
  });

  fastify.route({
    method: "POST",
    url: "/companies/:company_id/threads/:thread_id/messages/:message_id/reaction",
    preValidation: [fastify.authenticate],
    handler: messagesController.reaction.bind(messagesController),
  });

  fastify.route({
    method: "POST",
    url: "/companies/:company_id/threads/:thread_id/messages/:message_id/bookmark",
    preValidation: [fastify.authenticate],
    handler: messagesController.bookmark.bind(messagesController),
  });

  fastify.route({
    method: "POST",
    url: "/companies/:company_id/threads/:thread_id/messages/:message_id/pin",
    preValidation: [fastify.authenticate],
    handler: messagesController.pin.bind(messagesController),
  });

  fastify.route({
    method: "POST",
    url: "/companies/:company_id/threads/:thread_id/messages/:message_id/delete",
    preValidation: [fastify.authenticate],
    handler: messagesController.delete.bind(messagesController),
  });

  /**
   * Views routes
   */
  fastify.route({
    method: "GET",
    url: "/companies/:company_id/workspaces/:workspace_id/channels/:channel_id/feed",
    preValidation: [fastify.authenticate],
    handler: viewsController.list.bind(viewsController),
  });

  fastify.route({
    method: "GET",
    url: "/companies/:company_id/files",
    preValidation: [fastify.authenticate],
    handler: viewsController.list.bind(viewsController),
  });

  fastify.route({
    method: "GET",
    url: "/companies/:company_id/bookmarks",
    preValidation: [fastify.authenticate],
    handler: viewsController.list.bind(viewsController),
  });

  fastify.route({
    method: "GET",
    url: "/companies/:company_id/inbox",
    preValidation: [fastify.authenticate],
    handler: viewsController.list.bind(viewsController),
  });

  fastify.route({
    method: "GET",
    url: "/companies/:company_id/search",
    preValidation: [fastify.authenticate],
    handler: viewsController.search.bind(viewsController),
  });

  next();
};

export default routes;

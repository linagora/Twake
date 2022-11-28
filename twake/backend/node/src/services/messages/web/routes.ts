import { FastifyInstance, FastifyPluginCallback } from "fastify";
import {
  MessagesController,
  ThreadsController,
  UserBookmarksController,
  ViewsController,
} from "./controllers";
import { MessagesFilesController } from "./controllers/messages-files";
import { listUserFiles } from "./schemas";

const routes: FastifyPluginCallback = (fastify: FastifyInstance, options, next) => {
  const threadsController = new ThreadsController();
  const messagesController = new MessagesController();
  const userBookmarksController = new UserBookmarksController();
  const viewsController = new ViewsController();
  const messagesFilesController = new MessagesFilesController();

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
    url: "/companies/:company_id/threads/:thread_id/messages/:message_id/download/:message_file_id",
    preValidation: [fastify.authenticate],
    handler: messagesController.download.bind(messagesController),
  });

  fastify.route({
    method: "POST",
    url: "/companies/:company_id/threads/:thread_id/messages/:message_id/delete",
    preValidation: [fastify.authenticate],
    handler: messagesController.delete.bind(messagesController),
  });

  fastify.route({
    method: "POST",
    url: "/companies/:company_id/threads/:thread_id/messages/:message_id/deletelink",
    preValidation: [fastify.authenticate],
    handler: messagesController.deleteLinkPreview.bind(messagesController),
  });

  fastify.route({
    method: "POST",
    url: "/companies/:company_id/workspaces/:workspace_id/threads/read",
    preValidation: [fastify.authenticate],
    handler: messagesController.read.bind(messagesController),
  });

  fastify.route({
    method: "GET",
    url: "/companies/:company_id/workspaces/:workspace_id/threads/:thread_id/messages/:message_id/seen",
    preValidation: [fastify.authenticate],
    handler: messagesController.seenBy.bind(messagesController),
  });

  /**
   * Views routes
   */
  fastify.route({
    method: "GET",
    url: "/companies/:company_id/workspaces/:workspace_id/channels/:channel_id/feed",
    preValidation: [fastify.authenticate],
    handler: viewsController.feed.bind(viewsController),
  });

  fastify.route({
    method: "GET",
    url: "/companies/:company_id/files",
    preValidation: [fastify.authenticate],
    schema: listUserFiles,
    handler: viewsController.files.bind(viewsController),
  });

  fastify.route({
    method: "GET",
    url: "/companies/:company_id/bookmarks",
    preValidation: [fastify.authenticate],
    handler: viewsController.bookmarks.bind(viewsController),
  });

  fastify.route({
    method: "GET",
    url: "/companies/:company_id/inbox",
    preValidation: [fastify.authenticate],
    handler: viewsController.inbox.bind(viewsController),
  });

  fastify.route({
    method: "GET",
    url: "/companies/:company_id/search",
    preValidation: [fastify.authenticate],
    handler: viewsController.search.bind(viewsController),
  });

  fastify.route({
    method: "GET",
    url: "/companies/:company_id/files/search",
    preValidation: [fastify.authenticate],
    handler: viewsController.searchFiles.bind(viewsController),
  });

  /**
   * Messages files routes
   */

  fastify.route({
    method: "GET",
    url: "/companies/:company_id/messages/:message_id/files/:message_file_id",
    preValidation: [fastify.authenticate],
    handler: messagesFilesController.getMessageFile.bind(messagesFilesController),
  });

  fastify.route({
    method: "DELETE",
    url: "/companies/:company_id/messages/:message_id/files/:message_file_id",
    preValidation: [fastify.authenticate],
    handler: messagesFilesController.deleteMessageFile.bind(messagesFilesController),
  });

  next();
};

export default routes;

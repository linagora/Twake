import { FastifyInstance, FastifyPluginCallback } from "fastify";
import { MessageServiceAPI } from "../api";

const routes: FastifyPluginCallback<{ service: MessageServiceAPI }> = (
  fastify: FastifyInstance,
  options,
  next,
) => {
  /**
   * Main threads message APIs
   */
  fastify.route({
    method: "POST",
    url: "/companies/:company_id/threads",
    preValidation: [fastify.authenticate],
    handler: (req, res) => {
      res.send("Create new thread and append a first message in it");
    },
  });

  fastify.route({
    method: "POST",
    url: "/companies/:company_id/threads/:thread_id/messages",
    preValidation: [fastify.authenticate],
    handler: (req, res) => {
      res.send("Create message in a thread");
    },
  });

  fastify.route({
    method: "POST",
    url: "/companies/:company_id/threads/:thread_id/messages/:message_id",
    preValidation: [fastify.authenticate],
    handler: (req, res) => {
      res.send("Edit message in a thread");
    },
  });

  fastify.route({
    method: "GET",
    url: "/companies/:company_id/threads/:thread_id/messages",
    preValidation: [fastify.authenticate],
    handler: (req, res) => {
      res.send("Get all messages in a thread");
    },
  });

  /**
   * Views routes
   */
  fastify.route({
    method: "GET",
    url: "/companies/:company_id/workspaces/:workspace_id/channels/:channel_id/feed",
    preValidation: [fastify.authenticate],
    handler: (req, res) => {
      res.send("Get all messages in a channel");
    },
  });

  fastify.route({
    method: "GET",
    url: "/companies/:company_id/workspaces/:workspace_id/channels/:channel_id/filtered/:filter",
    preValidation: [fastify.authenticate],
    handler: (req, res) => {
      res.send("Get all messages in a channel filtered by pinned for instance");
    },
  });

  fastify.route({
    method: "GET",
    url: "/companies/:company_id/files",
    preValidation: [fastify.authenticate],
    handler: (req, res) => {
      res.send("Get all files in a channel or for a user");
    },
  });

  fastify.route({
    method: "GET",
    url: "/companies/:company_id/bookmarks",
    preValidation: [fastify.authenticate],
    handler: (req, res) => {
      res.send("Get all messages for a bookmark");
    },
  });

  fastify.route({
    method: "GET",
    url: "/companies/:company_id/inbox",
    preValidation: [fastify.authenticate],
    handler: (req, res) => {
      res.send("Get all messages in user inbox");
    },
  });

  /**
   * User bookmarks collection
   */
  fastify.route({
    method: "GET",
    url: "/preferences/bookmarks",
    preValidation: [fastify.authenticate],
    handler: (req, res) => {
      res.send("Get bookmarks");
    },
  });

  fastify.route({
    method: "POST",
    url: "/preferences/bookmarks",
    preValidation: [fastify.authenticate],
    handler: (req, res) => {
      res.send("Post new bookmarks");
    },
  });

  fastify.route({
    method: "DELETE",
    url: "/preferences/bookmarks/:name",
    preValidation: [fastify.authenticate],
    handler: (req, res) => {
      res.send("Remove bookmark by name");
    },
  });

  next();
};

export default routes;

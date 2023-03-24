import * as Sentry from "@sentry/node";
import config from "./config";
import fastify from "fastify";
import http from "http";

if (config.get("sentry.dsn")) {
  Sentry.init({
    dsn: config.get("sentry.dsn"),
    tracesSampleRate: 1.0,
  });
}

const launch = async (): Promise<void> => {
  const server = fastify<http.Server, http.IncomingMessage>();
  server.all("/plugins/*", (req, rep) => {
    console.log("Got on plugins: ", req.url);
    rep.send({ ok: true });
  });
  server.listen(3100);
};

launch();

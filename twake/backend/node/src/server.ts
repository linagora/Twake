import * as Sentry from "@sentry/node";
import { TwakePlatform } from "./core/platform/platform";
import config from "./core/config";
import twake from "./twake";

if (config.get("sentry.dsn")) {
  Sentry.init({
    dsn: config.get("sentry.dsn"),
    tracesSampleRate: 1.0,
  });
}

const launch = async (): Promise<TwakePlatform> => twake.run(config.get("services"));

// noinspection JSIgnoredPromiseFromCall
launch();

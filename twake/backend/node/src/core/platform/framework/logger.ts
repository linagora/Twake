import pino from "pino";
import { Configuration } from "./configuration";

const config = new Configuration("logger");

export type TwakeLogger = pino.Logger;

export const logger = pino({
  name: "TwakeApp",
  level: config.get("level", "info") || "info",
  prettyPrint:
    process.env.NODE_ENV?.indexOf("test") > -1
      ? {
          translateTime: "HH:MM:ss Z",
          ignore: "pid,hostname,name",
        }
      : false,
});

export const getLogger = (name?: string): TwakeLogger =>
  logger.child({ name: `twake${name ? "." + name : ""}` });

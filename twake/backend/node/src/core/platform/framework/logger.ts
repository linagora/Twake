import pino from "pino";
import { Configuration } from "./configuration";

const config = new Configuration("logger");

export const logger = pino({
  name: "TwakeApp",
  level: config.get("level", "info"),
});

export const getLogger = (name?: string): pino.Logger =>
  logger.child({ name: `twake${name ? "." + name : ""}` });

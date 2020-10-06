import pino from "pino";

// TODO: Get from config
const level = "debug";

export const logger = pino({
  name: "TwakeApp",
  level
});
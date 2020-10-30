import pino from "pino";

// TODO: Get from config
const level = "info";

export const logger = pino({
  name: "TwakeApp",
  level,
});

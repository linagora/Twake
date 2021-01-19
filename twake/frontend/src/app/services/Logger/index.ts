import log from "loglevel";
import prefix from "loglevel-plugin-prefix";
const isProduction = process.env?.NODE_ENV === "production";

const logger = log.getLogger("Twake");

isProduction ? logger.setDefaultLevel(log.levels.WARN) : logger.setDefaultLevel(log.levels.DEBUG);

prefix.reg(log);
prefix.apply(logger, {
  template: `${isProduction ? "" : "[%t] "}%l - %n -`,
  levelFormatter(level) {
    return level.toUpperCase();
  },
  nameFormatter(name) {
    return name || "Twake";
  },
  timestampFormatter(date) {
    return date.toISOString();
  },
});

export default logger;

import pino from "pino";

// TODO: Get from config
const level = "debug";

export default pino({
  name: "TwakeApp",
  level
});
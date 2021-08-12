import { TwakeService } from "./Decorators/TwakeService";

@TwakeService('Environment')
class Environment {
  isProduction() {
    return process.env?.NODE_ENV === "production";
  }
}

export default new Environment();

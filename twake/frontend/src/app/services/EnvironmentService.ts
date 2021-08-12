import { TwakeService } from "./Decorators/TwakeService";

@TwakeService('EnvironmentService')
class Environement {
  isProduction() {
    return process.env?.NODE_ENV === "production";
  }
}

export default new Environement();

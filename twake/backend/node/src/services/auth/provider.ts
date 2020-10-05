import { TwakeServiceProvider } from "../../core/platform/service";

export default interface AuthServiceAPI extends TwakeServiceProvider {
  /**
   * Get the authentication types
   */
  getTypes(): Array<string>
}

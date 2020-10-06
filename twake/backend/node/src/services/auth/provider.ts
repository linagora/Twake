import { TwakeServiceProvider } from "../../core/platform/framework/api";

export default interface AuthServiceAPI extends TwakeServiceProvider {
  /**
   * Get the authentication types
   */
  getTypes(): Array<string>
}

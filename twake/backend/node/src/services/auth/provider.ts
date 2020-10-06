import { TwakeServiceProvider } from "../../core/platform/api";

export default interface AuthServiceAPI extends TwakeServiceProvider {
  /**
   * Get the authentication types
   */
  getTypes(): Array<string>
}

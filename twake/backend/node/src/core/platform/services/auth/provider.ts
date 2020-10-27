import { TwakeServiceProvider } from "../../framework/api";

export default interface AuthServiceAPI extends TwakeServiceProvider {
  /**
   * Get the authentication types
   */
  getTypes(): Array<string>
}

import { TwakeServiceProvider } from "../../framework/api";

export default interface AuthServiceAPI extends TwakeServiceProvider {
  /**
   * Get the authentication types
   */
  getTypes(): Array<string>;

  /**
   * Sign payload
   */
  sign(payload: any): string;

  /**
   * Verify token
   *
   * @param token
   */
  verifyToken(token: string): boolean;
}

export interface JwtConfiguration {
  secret: string;
}

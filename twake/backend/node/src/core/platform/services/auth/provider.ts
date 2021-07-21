import { TwakeServiceProvider } from "../../framework/api";
import { AccessToken, uuid } from "../../../../utils/types";

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

  generateJWT(userId: uuid, email: string): AccessToken;
}

export interface JwtConfiguration {
  secret: string;
  expiration: number;
  refresh_expiration: number;
}

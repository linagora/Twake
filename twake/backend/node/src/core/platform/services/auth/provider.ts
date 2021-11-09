import { TwakeServiceProvider } from "../../framework/api";
import { AccessToken, JWTObject, uuid } from "../../../../utils/types";

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
  verifyToken(token: string): JWTObject;

  verifyTokenObject<T>(token: string): T;

  generateJWT(
    userId: uuid,
    email: string,
    options: { track: boolean; provider_id: string },
  ): AccessToken;
}

export interface JwtConfiguration {
  secret: string;
  expiration: number;
  refresh_expiration: number;
}

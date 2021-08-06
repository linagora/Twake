import AuthServiceAPI, { JwtConfiguration } from "./provider";
import jwt from "jsonwebtoken";
import { AccessToken, JWTObject, uuid } from "../../../../utils/types";
import assert from "assert";

export class AuthService implements AuthServiceAPI {
  version: "1";

  constructor(private configuration: JwtConfiguration) {}

  getTypes(): string[] {
    throw new Error("Method not implemented.");
  }

  // eslint-disable-next-line @typescript-eslint/ban-types
  sign(payload: string | object | Buffer): string {
    return jwt.sign(payload, this.configuration.secret);
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  verifyToken(token: string): JWTObject {
    return jwt.verify(token, this.configuration.secret) as JWTObject;
  }

  generateJWT(userId: uuid, email: string, allow_tracking: boolean = false): AccessToken {
    const now = Math.round(new Date().getTime() / 1000); // Current time in UTC
    assert(this.configuration.expiration, "jwt.expiration is missing");
    assert(this.configuration.refresh_expiration, "jwt.refresh_expiration is missing");

    const jwtExpiration = now + this.configuration.expiration;
    const jwtRefreshExpiration = now + this.configuration.refresh_expiration;
    return {
      time: now,
      expiration: jwtExpiration,
      refresh_expiration: jwtRefreshExpiration,
      value: this.sign({
        exp: jwtExpiration,
        type: "access",
        iat: now - 60 * 10,
        nbf: now - 60 * 10,
        sub: userId,
        email: email,
        track: allow_tracking,
      }),
      refresh: this.sign({
        exp: jwtRefreshExpiration,
        type: "refresh",
        iat: now - 60 * 10,
        nbf: now - 60 * 10,
        sub: userId,
        track: allow_tracking,
      }),
      type: "Bearer",
    };
  }
}

import AuthServiceAPI, { JwtConfiguration } from "./provider";
import jwt from "jsonwebtoken";

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
  verifyToken(token: string): boolean {
    throw new Error("Method not implemented.");
  }
}

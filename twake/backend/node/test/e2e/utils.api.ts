import { TestPlatform } from "./setup";
import { InjectPayload, Response } from "light-my-request";
import { logger as log } from "../../src/core/platform/framework";

declare global {
  interface ApiResponse extends Response {
    resources: any[];
    resource: any;
  }
}

export class Api {
  constructor(protected platform: TestPlatform) {}

  private async convertResponse(response: Promise<Response>): Promise<ApiResponse> {
    const apiResponse = (await response) as ApiResponse;
    const json = apiResponse.json();
    apiResponse.resources = json.resources;
    apiResponse.resource = json.resource;
    return apiResponse;
  }

  private getJwtToken(userId: string) {
    return this.platform.auth.getJWTToken({ sub: userId });
  }

  async request(
    method: "GET" | "POST",
    url: string,
    payload: InjectPayload,
    userId: string,
  ): Promise<ApiResponse> {
    if (!userId) userId = this.platform.currentUser.id;

    return this.convertResponse(
      this.platform.app
        .inject({
          method,
          url,
          headers: { authorization: `Bearer ${await this.getJwtToken(userId)}` },
          payload,
        })
        .then(a => {
          log.debug(a.json(), `${method} ${url}`);
          return a;
        }),
    );
  }

  public async get(url: string, userId?: string): Promise<ApiResponse> {
    return this.request("GET", url, undefined, userId);
  }

  public async post(url: string, payload: InjectPayload, userId?: string): Promise<ApiResponse> {
    return this.request("POST", url, payload, userId);
  }
}

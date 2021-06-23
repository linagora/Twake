import { beforeAll, afterAll, afterEach, beforeEach, describe, expect, it } from "@jest/globals";
import { init, TestPlatform } from "../setup";

describe("The /users API", () => {
  const url = "/internal/services/users/v1";
  let platform: TestPlatform;

  beforeEach(async ends => {
    platform = await init({
      services: ["database", "search", "pubsub", "websocket", "webserver", "user", "auth"],
    });
    ends();
  });
  afterEach(async ends => {
    ends();
  });

  describe("The GET /users/?search=... route", () => {});
});

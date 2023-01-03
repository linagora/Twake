import { describe, beforeEach, afterEach, it, expect } from "@jest/globals";
import { init, TestPlatform } from "../setup";
import { e2e_createDocument } from "./utils";

describe("the Documents feature", () => {
  let platform: TestPlatform;

  beforeEach(async () => {
    platform = await init({
      services: [
        "webserver",
        "database",
        "applications",
        "search",
        "storage",
        "message-queue",
        "user",
        "search",
        "files",
        "websocket",
        "messages",
        "auth",
        "realtime",
        "channels",
        "counter",
        "statistics",
        "platform-services",
        "documents",
      ],
    });
  });

  afterEach(async () => {
    platform.tearDown();
  });

  describe("On user send Drive item", () => {
    it("did create the drive item", async done => {
      const item = {
        company_id: "123",
        name: "drive item",
      };

      const version = {};

      const response = await e2e_createDocument(platform, item, version);

      expect(response.body).toEqual("1");

      done && done();
    });
  });
});

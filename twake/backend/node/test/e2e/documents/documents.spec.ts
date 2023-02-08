import { describe, beforeEach, afterEach, it, expect } from "@jest/globals";
import { deserialize } from "class-transformer";
import { init, TestPlatform } from "../setup";
import { TestDbService } from "../utils.prepare.db";
import { e2e_createDocument, e2e_getDocument } from "./utils";

describe("the Documents feature", () => {
  let platform: TestPlatform;

  class DriveFileMockClass {
    id: string;
    name: string;
    size: number;
    added: string;
    parent_id: string;
  }

  class DriveItemDetailsMockClass {
    path: string[];
    item: DriveFileMockClass;
    children: DriveFileMockClass[];
  }

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
    it("did create the drive item", async () => {
      await TestDbService.getInstance(platform, true);

      const item = {
        name: "new test file",
        parent_id: "root",
        company_id: platform.workspace.company_id,
      };

      const version = {};

      const response = await e2e_createDocument(platform, item, version);
      const result = deserialize<DriveFileMockClass>(DriveFileMockClass, response.body);

      expect(result).toBeDefined();
      expect(result.name).toEqual("new test file");
      expect(result.added).toBeDefined();

    });

    it("did fetch the drive item", async () => {
      const response = await e2e_getDocument(platform, "");
      const result = deserialize<DriveItemDetailsMockClass>(
        DriveItemDetailsMockClass,
        response.body,
      );

      expect(result.item.name).toEqual("root");

    });
  });
});

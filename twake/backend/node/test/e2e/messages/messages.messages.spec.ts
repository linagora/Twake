import "reflect-metadata";
import { describe, expect, it, beforeEach, afterEach } from "@jest/globals";
import { TestPlatform, init } from "../setup";
import { UserMessageBookmark } from "../../../src/services/messages/entities/user-message-bookmarks";
import {
  ResourceDeleteResponse,
  ResourceListResponse,
  ResourceUpdateResponse,
} from "../../../src/services/types";
import { deserialize } from "class-transformer";
import { MessageServiceAPI } from "../../../src/services/messages/api";
import { v4 as uuidv4 } from "uuid";
import { Thread } from "../../../src/services/messages/entities/threads";

describe("The Messages feature", () => {
  const url = "/internal/services/messages/v1";
  let platform: TestPlatform;

  beforeEach(async () => {
    platform = await init({
      services: [
        "pubsub",
        "user",
        "websocket",
        "webserver",
        "messages",
        "auth",
        "database",
        "realtime",
      ],
    });
  });

  afterEach(async () => {
    await platform.tearDown();
  });

  describe("On user use messages in a thread", () => {});
});

function getContext(platform) {
  return {
    company: { id: platform.workspace.company_id },
    user: { id: platform.currentUser.id },
  };
}

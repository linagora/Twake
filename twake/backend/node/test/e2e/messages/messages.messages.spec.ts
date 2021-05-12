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
import { createMessage, e2e_createMessage, e2e_createThread } from "./utils";

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

  describe("On user use messages in a thread", () => {
    it("should create a message in a thread", async () => {
      const response = await e2e_createThread(
        platform,
        [],
        createMessage({ text: "Initial thread message" }),
      );
      const result: ResourceUpdateResponse<Thread> = deserialize(
        ResourceUpdateResponse,
        response.body,
      );
      const threadId = result.resource.id;

      await e2e_createMessage(platform, threadId, createMessage({ text: "Reply 1" }));

      await e2e_createMessage(platform, threadId, createMessage({ text: "Reply 2" }));

      const jwtToken = await platform.auth.getJWTToken();
      const listResponse = await platform.app.inject({
        method: "GET",
        url: `${url}/companies/${platform.workspace.company_id}/threads/${threadId}/messages`,
        headers: {
          authorization: `Bearer ${jwtToken}`,
        },
      });

      const listResult: ResourceListResponse<Thread> = deserialize(
        ResourceListResponse,
        listResponse.body,
      );

      expect(listResponse.statusCode).toBe(200);
      expect(listResult.resources.length).toBe(3);
    });
  });
});

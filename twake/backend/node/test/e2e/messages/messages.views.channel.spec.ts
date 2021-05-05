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
import { createMessage, createParticipant, e2e_createMessage, e2e_createThread } from "./utils";
import { MessageWithReplies } from "../../../src/services/messages/types";

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

  describe("On user use messages in channel view", () => {
    it("should create a message and retrieve it in channel view", async () => {
      const channelId = uuidv4();

      const response = await e2e_createThread(
        platform,
        [
          createParticipant(
            {
              type: "channel",
              id: channelId,
            },
            platform,
          ),
        ],
        createMessage({ text: "Initial thread 1 message" }),
      );
      const result: ResourceUpdateResponse<Thread> = deserialize(
        ResourceUpdateResponse,
        response.body,
      );
      const threadId = result.resource.id;

      await e2e_createMessage(platform, threadId, createMessage({ text: "Reply 1" }));

      await e2e_createMessage(platform, threadId, createMessage({ text: "Reply 2" }));

      await e2e_createThread(
        platform,
        [
          createParticipant(
            {
              type: "channel",
              id: channelId,
            },
            platform,
          ),
        ],
        createMessage({ text: "Initial thread 2 message" }),
      );

      await new Promise(resolve => setTimeout(resolve, 1000));

      await e2e_createMessage(platform, threadId, createMessage({ text: "Reply 3" }));

      await new Promise(resolve => setTimeout(resolve, 1000));

      await e2e_createThread(
        platform,
        [
          createParticipant(
            {
              type: "channel",
              id: channelId,
            },
            platform,
          ),
        ],
        createMessage({ text: "Initial thread 3 message" }),
      );

      await new Promise(resolve => setTimeout(resolve, 1000));

      const jwtToken = await platform.auth.getJWTToken();
      const listResponse = await platform.app.inject({
        method: "GET",
        url: `${url}/companies/${platform.workspace.company_id}/workspaces/${platform.workspace.workspace_id}/channels/${channelId}/feed`,
        headers: {
          authorization: `Bearer ${jwtToken}`,
        },
      });

      const listResult: ResourceListResponse<MessageWithReplies> = deserialize(
        ResourceListResponse,
        listResponse.body,
      );

      expect(listResponse.statusCode).toBe(200);
      expect(listResult.resources.length).toBe(3);

      expect(listResult.resources[0].text).toBe("Initial thread 2 message");
      expect(listResult.resources[1].text).toBe("Initial thread 1 message");
      expect(listResult.resources[2].text).toBe("Initial thread 3 message");

      expect(listResult.resources[0].stats.replies).toBe(1);
      expect(listResult.resources[1].stats.replies).toBe(4);
      expect(listResult.resources[2].stats.replies).toBe(1);
      expect(listResult.resources[1].last_replies.length).toBe(3);
    });
  });
});

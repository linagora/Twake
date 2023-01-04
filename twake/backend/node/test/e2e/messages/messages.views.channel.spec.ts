import "reflect-metadata";
import { afterEach, beforeEach, describe, expect, it } from "@jest/globals";
import { init, TestPlatform } from "../setup";
import { ResourceListResponse, ResourceUpdateResponse } from "../../../src/utils/types";
import { deserialize } from "class-transformer";
import { v4 as uuidv4 } from "uuid";
import { Thread } from "../../../src/services/messages/entities/threads";
import {
  createMessage,
  createParticipant,
  e2e_createChannel,
  e2e_createMessage,
  e2e_createThread,
} from "./utils";
import { MessageWithReplies } from "../../../src/services/messages/types";

describe("The Messages feature", () => {
  const url = "/internal/services/messages/v1";
  let platform: TestPlatform;

  beforeEach(async () => {
    platform = await init({
      services: [
        "webserver",
        "database",
        "search",
        "storage",
        "files",
        "applications",
        "message-queue",
        "user",
        "websocket",
        "messages",
        "auth",
        "search",
        "realtime",
        "channels",
        "counter",
        "statistics",
        "platform-services",
      ],
    });
  });

  afterEach(async () => {
    await platform.tearDown();
  });

  describe("On user use messages in channel view", () => {
    it("should create a message and retrieve it in channel view", async () => {
      const channel = await e2e_createChannel(platform, [platform.currentUser.id]);

      const response = await e2e_createThread(
        platform,
        [
          createParticipant(
            {
              type: "channel",
              id: channel.resource.id,
              workspace_id: channel.resource.workspace_id,
              company_id: channel.resource.company_id,
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
              id: channel.resource.id,
              workspace_id: channel.resource.workspace_id,
              company_id: channel.resource.company_id,
            },
            platform,
          ),
        ],
        createMessage({ text: "Initial thread 2 message" }),
      );

      await e2e_createMessage(platform, threadId, createMessage({ text: "Reply 3" }));

      await e2e_createThread(
        platform,
        [
          createParticipant(
            {
              type: "channel",
              id: channel.resource.id,
              workspace_id: channel.resource.workspace_id,
              company_id: channel.resource.company_id,
            },
            platform,
          ),
        ],
        createMessage({ text: "Initial thread 3 message" }),
      );

      const jwtToken = await platform.auth.getJWTToken();
      const listResponse = await platform.app.inject({
        method: "GET",
        url: `${url}/companies/${channel.resource.company_id}/workspaces/${channel.resource.workspace_id}/channels/${channel.resource.id}/feed?replies_per_thread=3&include_users=1`,
        headers: {
          authorization: `Bearer ${jwtToken}`,
        },
      });

      const listResult: ResourceListResponse<MessageWithReplies> = deserialize(
        ResourceListResponse,
        listResponse.body,
      );

      await new Promise(resolve => setTimeout(resolve, 5000));

      expect(listResponse.statusCode).toBe(200);
      expect(listResult.resources.length).toBe(3);

      expect(listResult.resources[0].text).toBe("Initial thread 2 message");
      expect(listResult.resources[1].text).toBe("Initial thread 1 message");
      expect(listResult.resources[2].text).toBe("Initial thread 3 message");

      expect(listResult.resources[0].stats.replies).toBe(1);
      expect(listResult.resources[1].stats.replies).toBe(4); //Thread initial message + 3 replies
      expect(listResult.resources[2].stats.replies).toBe(1);

      expect(listResult.resources[1].last_replies.length).toBe(3); //We requested 3 replies per posts
      expect(listResult.resources[1].last_replies[0].text).toBe("Reply 1"); //Check order is OK
      expect(listResult.resources[1].last_replies[2].text).toBe("Reply 3");
    });
  });
});

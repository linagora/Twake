import "reflect-metadata";
import { describe, expect, it, beforeEach, afterEach } from "@jest/globals";
import { TestPlatform, init } from "../setup";
import { ResourceListResponse, ResourceUpdateResponse } from "../../../src/utils/types";
import { deserialize } from "class-transformer";
import { Thread } from "../../../src/services/messages/entities/threads";
import { createMessage, e2e_createMessage, e2e_createThread } from "./utils";
import { Message } from "../../../src/services/messages/entities/messages";
import { v1 as uuidv1 } from "uuid";

describe("The Messages feature", () => {
  const url = "/internal/services/messages/v1";
  let platform: TestPlatform;

  beforeEach(async () => {
    platform = await init({
      services: [
        "pubsub",
        "user",
        "search",
        "websocket",
        "webserver",
        "messages",
        "auth",
        "database",
        "search",
        "realtime",
        "channels",
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

    it("should move the message in threads", async () => {
      const userA = uuidv1();
      const userB = uuidv1();
      const userC = uuidv1();

      const thread1Request = await e2e_createThread(
        platform,
        [],
        createMessage({ text: "Message A in thread 1", user_id: userA }),
      );
      const thread1Result: ResourceUpdateResponse<Thread> = deserialize(
        ResourceUpdateResponse,
        thread1Request.body,
      );
      const thread1: Thread = thread1Result.resource;

      const thread2Request = await e2e_createThread(
        platform,
        [],
        createMessage({ text: "Message B in thread 2", user_id: userB }),
      );
      const thread2Result: ResourceUpdateResponse<Thread> = deserialize(
        ResourceUpdateResponse,
        thread2Request.body,
      );
      const thread2: Thread = thread2Result.resource;

      const messageCRequest = await e2e_createMessage(
        platform,
        thread1.id,
        createMessage({ text: "Message C in thread 1", user_id: userC }),
      );
      const messageCResult: ResourceUpdateResponse<Message> = deserialize(
        ResourceUpdateResponse,
        messageCRequest.body,
      );
      const messageC: Message = messageCResult.resource;

      const messageCAfterMoveRequest = await platform.app.inject({
        method: "POST",
        url: `${url}/companies/${platform.workspace.company_id}/threads/${thread2.id}/messages/${messageC.id}`,
        headers: {
          authorization: `Bearer ${await platform.auth.getJWTToken({ sub: userA })}`,
        },
        payload: {
          resource: messageC,
          options: {
            previous_thread: thread1.id,
          },
        },
      });
      const messageCAfterMoveResult: ResourceUpdateResponse<Message> = deserialize(
        ResourceUpdateResponse,
        messageCAfterMoveRequest.body,
      );
      const messageCAfterMove: Message = messageCAfterMoveResult.resource;

      //See if message was moved correctly to the new thread
      expect(messageCAfterMove.user_id).toBe(userC);
      expect(messageCAfterMove.thread_id).toBe(thread2.id);

      const messageCAfterMove2Request = await platform.app.inject({
        method: "POST",
        url: `${url}/companies/${platform.workspace.company_id}/threads/${messageC.id}/messages/${messageC.id}`,
        headers: {
          authorization: `Bearer ${await platform.auth.getJWTToken({ sub: userA })}`,
        },
        payload: {
          resource: messageC,
          options: {
            previous_thread: thread2.id,
          },
        },
      });
      const messageCAfterMove2Result: ResourceUpdateResponse<Message> = deserialize(
        ResourceUpdateResponse,
        messageCAfterMove2Request.body,
      );
      const messageCAfter2Move: Message = messageCAfterMove2Result.resource;

      //See if message was moved correctly to new standalone thread
      expect(messageCAfter2Move.user_id).toBe(userC);
      expect(messageCAfter2Move.thread_id).toBe(messageCAfter2Move.id);

      //TODO check counts
    });
  });
});

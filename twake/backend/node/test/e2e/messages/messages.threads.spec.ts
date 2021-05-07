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
import { createMessage, createParticipant, e2e_createThread } from "./utils";

describe("The Messages Threads feature", () => {
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

  describe("On user manage threads", () => {
    it("should create new thread", async done => {
      const response = await e2e_createThread(
        platform,
        [
          createParticipant(
            {
              type: "user",
              id: platform.currentUser.id,
            },
            platform,
          ),
        ],
        createMessage(
          {
            text: "Hello!",
          },
          platform,
        ),
      );

      const result: ResourceUpdateResponse<Thread> = deserialize(
        ResourceUpdateResponse,
        response.body,
      );

      expect(response.statusCode).toBe(200);
      expect(result.resource).toMatchObject({
        created_by: platform.currentUser.id,
      });
      expect(result.resource.participants.length).toBe(1);
      expect(result.resource.participants[0]).toMatchObject({
        type: "user",
        id: platform.currentUser.id,
        created_by: platform.currentUser.id,
      });
      expect(result.resource.participants[0].created_at).toBeDefined();

      done();
    });

    it("should enforce requester in thread participants", async done => {
      const response = await e2e_createThread(
        platform,
        [
          createParticipant(
            {
              type: "user",
              id: uuidv4(),
            },
            platform,
          ),
        ],
        createMessage(
          {
            text: "Hello!",
          },
          platform,
        ),
      );

      const result: ResourceUpdateResponse<Thread> = deserialize(
        ResourceUpdateResponse,
        response.body,
      );

      expect(response.statusCode).toBe(200);
      expect(result.resource).toMatchObject({
        created_by: platform.currentUser.id,
      });
      expect(result.resource.participants.length).toBe(2);
      expect(
        result.resource.participants.filter(p => p.id === platform.currentUser.id)[0],
      ).toMatchObject({
        type: "user",
        id: platform.currentUser.id,
      });

      done();
    });

    it("should update thread participants when add participant", async done => {
      const service = platform.platform.getProvider<MessageServiceAPI>("messages");

      //Create thread
      const thread = await service.threads.save(
        {
          id: undefined,
          participants: [
            {
              type: "user",
              id: platform.currentUser.id,
            },
          ],
        },
        {},
        getContext(platform),
      );

      const jwtToken = await platform.auth.getJWTToken();
      const response = await platform.app.inject({
        method: "POST",
        url: `${url}/companies/${platform.workspace.company_id}/threads/${thread.entity.id}`,
        headers: {
          authorization: `Bearer ${jwtToken}`,
        },
        payload: {
          resource: {},
          options: {
            participants: {
              add: [
                {
                  type: "user",
                  id: uuidv4(),
                },
              ],
            },
          },
        },
      });

      const result: ResourceUpdateResponse<Thread> = deserialize(
        ResourceUpdateResponse,
        response.body,
      );

      expect(response.statusCode).toBe(200);
      expect(result.resource.participants.length).toBe(2);

      done();
    });

    it("should update thread participants when remove participant", async done => {
      const service = platform.platform.getProvider<MessageServiceAPI>("messages");

      //Create thread
      const thread = await service.threads.save(
        {
          id: undefined,
          participants: [
            {
              type: "user",
              id: platform.currentUser.id,
            },
            {
              type: "channel",
              id: uuidv4(),
            },
          ],
        },
        {},
        getContext(platform),
      );

      const jwtToken = await platform.auth.getJWTToken();
      const response = await platform.app.inject({
        method: "POST",
        url: `${url}/companies/${platform.workspace.company_id}/threads/${thread.entity.id}`,
        headers: {
          authorization: `Bearer ${jwtToken}`,
        },
        payload: {
          resource: {},
          options: {
            participants: {
              remove: [
                {
                  type: "user",
                  id: platform.currentUser.id,
                },
              ],
            },
          },
        },
      });

      const result: ResourceUpdateResponse<Thread> = deserialize(
        ResourceUpdateResponse,
        response.body,
      );

      expect(response.statusCode).toBe(200);
      expect(result.resource.participants.length).toBe(1);

      done();
    });
  });
});

function getContext(platform) {
  return {
    company: { id: platform.workspace.company_id },
    user: { id: platform.currentUser.id },
  };
}

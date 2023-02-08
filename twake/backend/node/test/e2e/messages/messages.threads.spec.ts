import "reflect-metadata";
import { afterEach, beforeEach, describe, expect, it } from "@jest/globals";
import { init, TestPlatform } from "../setup";
import { ResourceUpdateResponse } from "../../../src/utils/types";
import { deserialize } from "class-transformer";
import { v1 as uuidv1, v4 as uuidv4 } from "uuid";
import { Thread } from "../../../src/services/messages/entities/threads";
import { createMessage, createParticipant, e2e_createThread } from "./utils";
import gr from "../../../src/services/global-resolver";

describe("The Messages Threads feature", () => {
  const url = "/internal/services/messages/v1";
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
      ],
    });
  });

  afterEach(async () => {
    await platform.tearDown();
  });

  describe("On user manage threads", () => {
    it("should create new thread", async () => {
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
      expect(result.resource?.created_by).toBe(platform.currentUser.id);
      expect(result.resource.participants.length).toBe(1);
      expect(result.resource.participants[0]).toMatchObject({
        type: "user",
        id: platform.currentUser.id,
        created_by: platform.currentUser.id,
      });
      expect(result.resource.participants[0].created_at).toBeDefined();

    });

    it("should enforce requester in thread participants", async () => {
      const response = await e2e_createThread(
        platform,
        [
          createParticipant(
            {
              type: "user",
              id: uuidv1(),
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

    });

    it("should update thread participants when add participant", async () => {
      //Create thread
      const thread = await gr.services.messages.threads.save(
        {
          id: undefined,
          participants: [
            {
              type: "user",
              id: platform.currentUser.id,
              company_id: platform.workspace.company_id,
            },
          ],
        },
        {
          message: createMessage(
            {
              text: "Hello!",
            },
            platform,
          ),
        },
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
                  id: uuidv1(),
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

    });

    it("should update thread participants when remove participant", async () => {
      //Create thread
      const thread = await gr.services.messages.threads.save(
        {
          id: undefined,
          participants: [
            {
              type: "user",
              id: platform.currentUser.id,
              company_id: platform.workspace.company_id,
            },
            {
              type: "channel",
              id: uuidv4(),
              workspace_id: platform.workspace.workspace_id,
              company_id: platform.workspace.company_id,
            },
          ],
        },
        {
          message: createMessage(
            {
              text: "Hello!",
            },
            platform,
          ),
        },
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

    });
  });
});

function getContext(platform: TestPlatform) {
  return {
    company: { id: platform.workspace.company_id },
    user: { id: platform.currentUser.id },
  };
}

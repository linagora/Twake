import { afterEach, beforeEach, describe, expect, it } from "@jest/globals";
import { init, TestPlatform } from "../setup";
import { TestDbService } from "../utils.prepare.db";
import { v1 as uuidv1 } from "uuid";
import { createMessage, e2e_createMessage, e2e_createThread } from "./utils";
import { ResourceUpdateResponse } from "../../../src/utils/types";
import { ParticipantObject, Thread } from "../../../src/services/messages/entities/threads";
import { deserialize } from "class-transformer";
import { Channel } from "../../../src/services/channels/entities";
import {
  ChannelUtils,
  get as getChannelUtils,
  getMemberUtils,
  ChannelMemberUtils,
} from "../channels/utils";
import ChannelServiceAPI from "../../../src/services/channels/provider";
import { assign } from "lodash";

describe("The /messages API", () => {
  const url = "/internal/services/messages/v1";
  let platform: TestPlatform;
  let channelUtils: ChannelUtils;
  let channelService;

  beforeEach(async ends => {
    platform = await init({
      services: [
        "database",
        "search",
        "pubsub",
        "websocket",
        "webserver",
        "user",
        "auth",
        "applications",
        "storage",
        "counter",
        "workspaces",
        "console",
        "statistics",
        "platform-services",
      ],
    });

    await platform.database.getConnector().drop();
    channelUtils = getChannelUtils(platform);
    channelService = platform.platform.getProvider<ChannelServiceAPI>("channels");

    ends();
  });

  afterEach(async ends => {
    platform && (await platform.tearDown());
    platform = null;
    ends();
  });

  describe("The GET /messages/?search=... route", () => {
    it("Should find the searched users", async done => {
      const testDbService = new TestDbService(platform);
      await testDbService.createCompany(platform.workspace.company_id);
      const workspacePk = {
        id: platform.workspace.workspace_id,
        company_id: platform.workspace.company_id,
      };
      const workspacePk2 = {
        id: uuidv1(),
        company_id: uuidv1(),
      };
      await testDbService.createWorkspace(workspacePk);
      // await testDbService.createWorkspace(workspacePk2);

      const channel = await createChannel();

      const participant = {
        type: "channel",
        id: channel.id,
        company_id: platform.workspace.company_id,
        workspace_id: platform.workspace.workspace_id,
      } as ParticipantObject;

      const firstThreadId = await createThread("First thread", [participant]);
      await createReply(firstThreadId, "First reply of first thread");
      await createReply(firstThreadId, "Second reply of first thread");

      const secondThreadId = await createThread("Another thread", [participant]);
      await createReply(secondThreadId, "First reply of second thread");
      await createReply(secondThreadId, "Second reply of second thread");

      //Wait for indexation to happen
      await new Promise(r => setTimeout(r, 3000));

      let resources = await search("Reply");
      expect(resources.length).toEqual(4);

      resources.forEach(resource => {
        expect(resource.last_replies.length).toEqual(1);
      });

      resources = await search("fdfsd");
      expect(resources.length).toEqual(0);

      resources = await search("first");
      expect(resources.length).toEqual(4);

      resources = await search("second");
      expect(resources.length).toEqual(3);

      resources = await search("another");
      expect(resources.length).toEqual(1);

      resources.forEach(resource => {
        expect(resource.last_replies.length).toEqual(0);
      });

      done();
    });
  });

  async function createChannel(): Promise<Channel> {
    const channel = channelUtils.getChannel(platform.currentUser.id);
    const creationResult = await channelService.channels.save(
      channel,
      {},
      channelUtils.getContext(),
    );

    return creationResult.entity;
  }

  async function createThread(text, participants: ParticipantObject[]) {
    const response = await e2e_createThread(platform, participants, createMessage({ text: text }));

    const result: ResourceUpdateResponse<Thread> = deserialize(
      ResourceUpdateResponse,
      response.body,
    );
    return result.resource.id;
  }

  async function createReply(threadId, text) {
    return e2e_createMessage(platform, threadId, createMessage({ text }));
  }

  async function search(searchString: string, companyId?: string): Promise<any[]> {
    const jwtToken = await platform.auth.getJWTToken();
    const response = await platform.app.inject({
      method: "GET",
      // url: `${url}/companies/${platform.workspace.company_id}/woskpaces/`,
      url: `${url}/companies/${platform.workspace.company_id}/search`,
      headers: {
        authorization: `Bearer ${jwtToken}`,
      },
      query: {
        q: searchString,
        ...(companyId ? { search_company_id: companyId } : {}),
      },
    });

    expect(response.statusCode).toBe(200);
    const json = response.json();
    expect(json).toMatchObject({ resources: expect.any(Array) });
    const resources = json.resources;
    return resources;
  }
});

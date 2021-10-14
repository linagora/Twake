// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-nocheck
import { beforeAll, describe, expect, it } from "@jest/globals";
import { init, TestPlatform } from "./setup";

import { v1 as uuidv1 } from "uuid";
import ChannelServiceAPI from "../../src/services/channels/provider";
import {
  createMessage,
  createParticipant,
  e2e_createMessage,
  e2e_createThread,
} from "./messages/utils";
import { Thread } from "../../src/services/messages/entities/threads";
import { deserialize } from "class-transformer";
import { WorkspaceExecutionContext } from "../../src/services/channels/types";
import { ChannelUtils, get as getChannelUtils } from "./channels/utils";
import { StatisticsAPI } from "../../src/services/statistics/types";
import { ResourceUpdateResponse } from "../../src/utils/types";

describe("Statistics implementation", () => {
  let platform: TestPlatform;
  // let database: DatabaseServiceAPI;
  let statisticsAPI: StatisticsAPI;
  let channelUtils: ChannelUtils;

  beforeAll(async ends => {
    platform = await init({
      services: ["database", "statistics", "webserver", "auth"],
    });

    await platform.database.getConnector().drop();

    statisticsAPI = platform.platform.getProvider<StatisticsAPI>("statistics");
    expect(statisticsAPI).toBeTruthy();

    ends();
    channelUtils = getChannelUtils(platform);
  });

  afterAll(done => {
    platform.tearDown().then(done);
  });

  it("Check statistics counters", async done => {
    await statisticsAPI.increase(platform.workspace.company_id, "counter-test");
    await statisticsAPI.increase(platform.workspace.company_id, "counter-test");
    const secondCompanyId = uuidv1();
    await statisticsAPI.increase(secondCompanyId, "counter-test");
    await statisticsAPI.increase(secondCompanyId, "counter-test");
    await statisticsAPI.increase(platform.workspace.company_id, "counter-test2");

    expect(await statisticsAPI.get(platform.workspace.company_id, "counter-test")).toEqual(2);
    expect(await statisticsAPI.get(secondCompanyId, "counter-test")).toEqual(2);
    expect(await statisticsAPI.get(undefined, "counter-test")).toEqual(4);

    expect(await statisticsAPI.get(platform.workspace.company_id, "counter-test2")).toEqual(1);
    expect(await statisticsAPI.get(secondCompanyId, "counter-test2")).toEqual(0);
    expect(await statisticsAPI.get(undefined, "counter-test2")).toEqual(1);

    done();
  });

  function getContext(user?: User): WorkspaceExecutionContext {
    return {
      workspace: platform.workspace,
      user: user || platform.currentUser,
    };
  }

  async function sleep(timeout = 0) {
    return new Promise(r => setTimeout(r, timeout));
  }

  describe("On user use messages in channel view", () => {
    it("should create a message and retrieve it in channel view", async () => {
      const channelService = platform.platform.getProvider<ChannelServiceAPI>("channels");
      const channel = channelUtils.getChannel();
      await channelService.channels.save(channel, {}, getContext());
      const channelId = channel.id;

      //Reset global value because messages could have been created somewhere else
      const value = await statisticsAPI.get(undefined, "messages");
      await statisticsAPI.increase(undefined, "messages", -value);

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

      await sleep();

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

      await e2e_createMessage(platform, threadId, createMessage({ text: "Reply 3" }));

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

      await new Promise(r => setTimeout(r, 5000));

      expect(await statisticsAPI.get(platform.workspace.company_id, "messages")).toEqual(6);
      expect(await statisticsAPI.get(undefined, "messages")).toEqual(6);
    });
  });
});

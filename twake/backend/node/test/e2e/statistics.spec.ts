import { afterAll, beforeAll, beforeEach, describe, expect, it } from "@jest/globals";
import { init, TestPlatform } from "./setup";

import { v1 as uuidv1 } from "uuid";
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
import { ResourceUpdateResponse, User } from "../../src/utils/types";
import gr from "../../src/services/global-resolver";

describe("Statistics implementation", () => {
  let platform: TestPlatform;
  // let database: DatabaseServiceAPI;
  let channelUtils: ChannelUtils;

  beforeAll(async () => {
    platform = await init({
      services: ["database", "statistics", "webserver", "auth"],
    });

    expect(gr.services.statistics).toBeTruthy();

    channelUtils = getChannelUtils(platform);
  });

  beforeEach(async () => {
    await platform.database.getConnector().drop();
  });

  afterAll(async () => {
    await platform.tearDown();
  });

  it("Check statistics counters", async () => {
    console.log(await gr.services.statistics.get(undefined, "counter-test"));

    expect(await gr.services.statistics.get(undefined, "counter-test")).toEqual(0);

    await gr.services.statistics.increase(platform.workspace.company_id, "counter-test");
    await gr.services.statistics.increase(platform.workspace.company_id, "counter-test");
    const secondCompanyId = uuidv1();
    await gr.services.statistics.increase(secondCompanyId, "counter-test");
    await gr.services.statistics.increase(secondCompanyId, "counter-test");
    await gr.services.statistics.increase(platform.workspace.company_id, "counter-test2");

    expect(await gr.services.statistics.get(platform.workspace.company_id, "counter-test")).toEqual(
      2,
    );
    expect(await gr.services.statistics.get(secondCompanyId, "counter-test")).toEqual(2);
    expect(await gr.services.statistics.get(undefined, "counter-test")).toEqual(4);

    expect(
      await gr.services.statistics.get(platform.workspace.company_id, "counter-test2"),
    ).toEqual(1);
    expect(await gr.services.statistics.get(secondCompanyId, "counter-test2")).toEqual(0);
    expect(await gr.services.statistics.get(undefined, "counter-test2")).toEqual(1);

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
      const channel = channelUtils.getChannel();
      await gr.services.channels.channels.save(channel, {}, getContext());
      const channelId = channel.id;

      //Reset global value because messages could have been created somewhere else
      const value = await gr.services.statistics.get(undefined, "messages");
      await gr.services.statistics.increase(undefined, "messages", -value);

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

      expect(await gr.services.statistics.get(undefined, "messages")).toEqual(6);
      expect(await gr.services.statistics.get(platform.workspace.company_id, "messages")).toEqual(
        6,
      );
    });
  });
});

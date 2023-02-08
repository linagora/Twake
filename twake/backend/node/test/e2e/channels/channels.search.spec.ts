import { afterEach, beforeEach, describe, expect, it } from "@jest/globals";
import { v1 as uuidv1 } from "uuid";
import { deserialize } from "class-transformer";
import { init, TestPlatform } from "../setup";
import { ResourceGetResponse, ResourceListResponse, User } from "../../../src/utils/types";
import { Channel } from "../../../src/services/channels/entities";
import { ChannelVisibility, WorkspaceExecutionContext } from "../../../src/services/channels/types";
import { ChannelMember } from "../../../src/services/channels/entities";
import { ChannelUtils, get as getChannelUtils } from "./utils";
import { TestDbService } from "../utils.prepare.db";
import { ChannelObject } from "../../../src/services/channels/services/channel/types";
import { Api } from "../utils.api";
import gr from "../../../src/services/global-resolver";

describe("The /internal/services/channels/v1 API", () => {
  const url = "/internal/services/channels/v1";
  let platform: TestPlatform;
  let channelUtils: ChannelUtils;
  let testDbService: TestDbService;
  let api: Api;

  beforeEach(async () => {
    platform = await init();
    testDbService = new TestDbService(platform);
    api = new Api(platform);
    channelUtils = getChannelUtils(platform);
  });

  afterEach(async () => {
    await platform?.tearDown();
    platform = null;
  });

  async function testAccess(url, method, done) {
    const jwtToken = await platform.auth.getJWTToken();
    const response = await platform.app.inject({
      method,
      url,
      headers: {
        authorization: `Bearer ${jwtToken}`,
      },
    });

    expect(response.statusCode).toBe(400);
  }

  function getContext(user?: User): WorkspaceExecutionContext {
    return {
      workspace: platform.workspace,
      user: user || platform.currentUser,
    };
  }

  /**
   * Get a new channel instance
   *
   * @param owner will be a random uuidv4 if not defined
   */
  function getChannel(owner: string = uuidv1()): Channel {
    const channel = new Channel();

    channel.name = "Test Channel";
    channel.company_id = platform.workspace.company_id;
    channel.workspace_id = platform.workspace.workspace_id;
    channel.is_default = false;
    channel.visibility = ChannelVisibility.PRIVATE;
    channel.archived = false;
    channel.owner = owner;

    return channel;
  }

  async function getChannelREST(channelId: string): Promise<ChannelObject> {
    const response = await api.get(
      `${url}/companies/${platform.workspace.company_id}/workspaces/${platform.workspace.workspace_id}/channels/${channelId}`,
    );

    expect(response.statusCode).toEqual(200);

    const channelGetResult: ResourceGetResponse<ChannelObject> = deserialize(
      ResourceGetResponse,
      response.body,
    );

    return channelGetResult.resource;
  }

  describe("Channels search", () => {
    it("Should find channels by name", async () => {
      const ws0pk = { id: uuidv1(), company_id: platform.workspace.company_id };
      await testDbService.createWorkspace(ws0pk);
      const newUser = await testDbService.createUser([ws0pk]);

      for (let i = 0; i < 10; i++) {
        const channel = getChannel();
        channel.name = `test channel ${i}`;
        await gr.services.channels.channels.save(channel, {}, getContext());

        if (i == 0) continue;
        await gr.services.channels.members.save(
          {
            channel_id: channel.id,
            workspace_id: channel.workspace_id,
            company_id: channel.company_id,
            user_id: newUser.id,
          } as ChannelMember,
          channelUtils.getChannelContext(channel, platform.currentUser),
        );
      }

      await new Promise(r => setTimeout(() => r(true), 1000));

      const jwtToken = await platform.auth.getJWTToken({ sub: newUser.id });
      const response = await platform.app.inject({
        method: "GET",
        url: `${url}/companies/${platform.workspace.company_id}/search`,
        headers: {
          authorization: `Bearer ${jwtToken}`,
        },
        query: {
          q: "test",
        },
      });

      const result: ResourceListResponse<Channel> = deserialize(
        ResourceListResponse,
        response.body,
      );

      expect(response.statusCode).toBe(200);
      expect(result.resources.length).toEqual(9);
    });
  });
});

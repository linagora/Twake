import { describe, expect, it, beforeEach, afterEach } from "@jest/globals";
import { v4 as uuidv4 } from "uuid";
import { deserialize } from "class-transformer";
import { TestPlatform, init } from "../setup";
import {
  ResourceListResponse,
  ResourceGetResponse,
  ResourceUpdateResponse,
} from "../../../src/services/types";
import ChannelServiceAPI from "../../../src/services/channels/provider";
import { Channel } from "../../../src/services/channels/entities/channel";
import { ChannelVisibility } from "../../../src/services/channels/types";
import {
  getPrivateRoomName,
  getPublicRoomName,
} from "../../../src/services/channels/services/channel/realtime";
import { WorkspaceExecutionContext } from "../../../src/services/channels/types";
import { User } from "../../../src/services/types";
import { ChannelMember } from "../../../src/services/channels/entities";
import { ChannelUtils, get as getChannelUtils } from "./utils";

describe.skip("The /internal/services/channels/v1 API", () => {
  const url = "/internal/services/channels/v1";
  let platform: TestPlatform;
  let channelUtils: ChannelUtils;

  beforeEach(async () => {
    platform = await init({
      services: ["user", "websocket", "webserver", "channels", "auth", "database", "pubsub"],
    });
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
    done();
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
  function getChannel(owner: string = uuidv4()): Channel {
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

  describe("The GET /companies/:companyId/workspaces/:workspaceId/channels route", () => {
    it("should 400 when companyId is not valid", async done => {
      testAccess(
        `${url}/companies/123/workspaces/${platform.workspace.workspace_id}/channels`,
        "GET",
        done,
      );
    });

    it("should 400 when workspaceId is not valid", async done => {
      testAccess(
        `${url}/companies/${platform.workspace.company_id}/workspaces/123/channels`,
        "GET",
        done,
      );
    });

    it("should return empty list of channels", async done => {
      const jwtToken = await platform.auth.getJWTToken();
      const response = await platform.app.inject({
        method: "GET",
        url: `${url}/companies/${platform.workspace.company_id}/workspaces/${platform.workspace.workspace_id}/channels`,
        headers: {
          authorization: `Bearer ${jwtToken}`,
        },
      });

      const result: ResourceListResponse<Channel> = deserialize(
        ResourceListResponse,
        response.body,
      );

      expect(response.statusCode).toBe(200);
      expect(result.resources.length).toEqual(0);

      done();
    });

    it("should return list of workspace channels", async done => {
      const channelService = platform.platform.getProvider<ChannelServiceAPI>("channels");
      const channel = new Channel();
      channel.name = "Test Channel";
      const creationResult = await channelService.channels.save(channel, {}, getContext());

      const jwtToken = await platform.auth.getJWTToken();
      const response = await platform.app.inject({
        method: "GET",
        url: `${url}/companies/${platform.workspace.company_id}/workspaces/${platform.workspace.workspace_id}/channels`,
        headers: {
          authorization: `Bearer ${jwtToken}`,
        },
      });

      const result: ResourceListResponse<Channel> = deserialize(
        ResourceListResponse,
        response.body,
      );

      expect(response.statusCode).toBe(200);
      expect(result.resources.length).toEqual(1);
      expect(result.resources[0]).toMatchObject({
        id: creationResult.entity.id,
        name: channel.name,
      });

      done();
    });

    it("should return list of channels the user is member of", async done => {
      const channelService = platform.platform.getProvider<ChannelServiceAPI>("channels");
      const channel1 = getChannel();
      const channel2 = getChannel();

      channel1.name = "Test Channel1";
      channel2.name = "Test Channel2";

      const creationResults = await Promise.all([
        channelService.channels.save(channel1, {}, getContext()),
        channelService.channels.save(channel2, {}, getContext()),
      ]);

      await channelService.members.save(
        {
          channel_id: channel1.id,
          workspace_id: channel1.workspace_id,
          company_id: channel1.company_id,
          user_id: platform.currentUser.id,
        } as ChannelMember,
        {},
        channelUtils.getChannelContext(channel1, platform.currentUser),
      );

      const jwtToken = await platform.auth.getJWTToken();
      const response = await platform.app.inject({
        method: "GET",
        url: `${url}/companies/${platform.workspace.company_id}/workspaces/${platform.workspace.workspace_id}/channels`,
        headers: {
          authorization: `Bearer ${jwtToken}`,
        },
        query: {
          mine: "true",
        },
      });

      console.log(response.body);
      const result: ResourceListResponse<Channel> = deserialize(
        ResourceListResponse,
        response.body,
      );

      expect(response.statusCode).toBe(200);
      expect(result.resources.length).toEqual(1);
      expect(result.resources[0]).toMatchObject({
        id: creationResults[0].entity.id,
      });

      done();
    });

    it("should return pagination information when not all channels are returned", async done => {
      const channelService = platform.platform.getProvider<ChannelServiceAPI>("channels");

      await Promise.all(
        "0123456789".split("").map(name => {
          const channel = new Channel();
          channel.name = name;
          return channelService.channels.save(channel, {}, getContext());
        }),
      ).catch(() => done(new Error("Failed on creation")));

      const jwtToken = await platform.auth.getJWTToken();
      const response = await platform.app.inject({
        method: "GET",
        url: `${url}/companies/${platform.workspace.company_id}/workspaces/${platform.workspace.workspace_id}/channels`,
        headers: {
          authorization: `Bearer ${jwtToken}`,
        },
        query: {
          limit: "5",
        },
      });

      const result: ResourceListResponse<Channel> = deserialize(
        ResourceListResponse,
        response.body,
      );

      expect(response.statusCode).toBe(200);
      expect(result.resources.length).toEqual(5);
      expect(result.next_page_token).toBeDefined;

      done();
    });

    it("should be able to paginate over channels from pagination information", async done => {
      const channelService = platform.platform.getProvider<ChannelServiceAPI>("channels");

      await Promise.all(
        "0123456789".split("").map(name => {
          const channel = new Channel();
          channel.name = name;
          return channelService.channels.save(channel, {}, getContext());
        }),
      ).catch(() => done(new Error("Failed on creation")));

      const jwtToken = await platform.auth.getJWTToken();
      const firstPage = await platform.app.inject({
        method: "GET",
        url: `${url}/companies/${platform.workspace.company_id}/workspaces/${platform.workspace.workspace_id}/channels`,
        headers: {
          authorization: `Bearer ${jwtToken}`,
        },
        query: {
          limit: "5",
        },
      });

      const firstPageChannels: ResourceListResponse<Channel> = deserialize(
        ResourceListResponse,
        firstPage.body,
      );

      expect(firstPage.statusCode).toBe(200);
      expect(firstPageChannels.resources.length).toEqual(5);
      expect(firstPageChannels.next_page_token).toBeDefined;

      const nextPage = firstPageChannels.next_page_token;
      const secondPage = await platform.app.inject({
        method: "GET",
        url: `${url}/companies/${platform.workspace.company_id}/workspaces/${platform.workspace.workspace_id}/channels`,
        headers: {
          authorization: `Bearer ${jwtToken}`,
        },
        query: {
          limit: "5",
          page_token: nextPage,
        },
      });

      const secondPageChannels: ResourceListResponse<Channel> = deserialize(
        ResourceListResponse,
        secondPage.body,
      );

      expect(secondPage.statusCode).toBe(200);
      expect(secondPageChannels.resources.length).toEqual(5);

      expect(
        new Set([
          ...firstPageChannels.resources.map(resource => resource.id),
          ...secondPageChannels.resources.map(resource => resource.id),
        ]).size,
      ).toEqual(10);

      done();
    });

    it("should not return pagination information when all channels are returned", async done => {
      const channelService = platform.platform.getProvider<ChannelServiceAPI>("channels");

      await Promise.all(
        "0123456789".split("").map(name => {
          const channel = new Channel();
          channel.name = name;
          return channelService.channels.save(channel, {}, getContext());
        }),
      ).catch(() => done(new Error("Failed on creation")));

      const jwtToken = await platform.auth.getJWTToken();
      const response = await platform.app.inject({
        method: "GET",
        url: `${url}/companies/${platform.workspace.company_id}/workspaces/${platform.workspace.workspace_id}/channels`,
        headers: {
          authorization: `Bearer ${jwtToken}`,
        },
        query: {
          limit: "11",
        },
      });

      const result: ResourceListResponse<Channel> = deserialize(
        ResourceListResponse,
        response.body,
      );

      expect(response.statusCode).toBe(200);
      expect(result.resources.length).toEqual(10);
      expect(result.next_page_token).not.toBeDefined;

      done();
    });

    it("should return websockets information", async done => {
      const jwtToken = await platform.auth.getJWTToken();
      const response = await platform.app.inject({
        method: "GET",
        url: `${url}/companies/${platform.workspace.company_id}/workspaces/${platform.workspace.workspace_id}/channels`,
        headers: {
          authorization: `Bearer ${jwtToken}`,
        },
        query: {
          websockets: "true",
        },
      });

      const result: ResourceListResponse<Channel> = deserialize(
        ResourceListResponse,
        response.body,
      );

      expect(response.statusCode).toBe(200);
      expect(result.websockets).toMatchObject([
        { room: getPublicRoomName(platform.workspace) },
        // user id is randomly generated
        { room: expect.stringContaining(getPrivateRoomName(platform.workspace, { id: "" })) },
      ]);

      done();
    });

    it("should return websockets and direct information", async done => {
      const jwtToken = await platform.auth.getJWTToken();
      const response = await platform.app.inject({
        method: "GET",
        url: `${url}/companies/${platform.workspace.company_id}/workspaces/${platform.workspace.workspace_id}/channels`,
        headers: {
          authorization: `Bearer ${jwtToken}`,
        },
        query: {
          websockets: "true",
          mine: "true",
        },
      });

      const result: ResourceListResponse<Channel> = deserialize(
        ResourceListResponse,
        response.body,
      );

      expect(response.statusCode).toBe(200);
      expect(result.websockets.length).toEqual(3);

      done();
    });
  });

  describe("The GET /companies/:companyId/workspaces/:workspaceId/channels/:id route", () => {
    it("should 400 when companyId is not valid", async done => {
      const channelId = "1";

      testAccess(
        `${url}/companies/123/workspaces/${platform.workspace.workspace_id}/channels/${channelId}`,
        "GET",
        done,
      );
    });

    it("should 400 when workspaceId is not valid", async done => {
      const channelId = "1";

      testAccess(
        `${url}/companies/${platform.workspace.company_id}/workspaces/123/channels/${channelId}`,
        "GET",
        done,
      );
    });

    it("should return the requested channel", async done => {
      const jwtToken = await platform.auth.getJWTToken();
      const channelService = platform.platform.getProvider<ChannelServiceAPI>("channels");
      const channel = new Channel();
      channel.name = "Test Channel";
      channel.company_id = platform.workspace.company_id;
      channel.workspace_id = platform.workspace.workspace_id;

      const creationResult = await channelService.channels.save(channel, {}, getContext());
      const response = await platform.app.inject({
        method: "GET",
        url: `${url}/companies/${platform.workspace.company_id}/workspaces/${platform.workspace.workspace_id}/channels/${creationResult.entity.id}`,
        headers: {
          authorization: `Bearer ${jwtToken}`,
        },
      });

      expect(response.statusCode).toEqual(200);

      const channelGetResult: ResourceGetResponse<Channel> = deserialize(
        ResourceGetResponse,
        response.body,
      );

      expect(channelGetResult.resource).toBeDefined();
      expect(channelGetResult.resource).toMatchObject({
        id: String(creationResult.entity.id),
        name: creationResult.entity.name,
      });
      expect(channelGetResult.websocket).toBeDefined();
      expect(channelGetResult.websocket).toMatchObject({
        name: creationResult.entity.name,
        room: `/channels/${creationResult.entity.id}`,
        encryption_key: "",
      });

      done();
    });
  });

  describe("The POST /companies/:companyId/workspaces/:workspaceId/channels route", () => {
    it("should 400 when companyId is not valid", async done => {
      testAccess(
        `${url}/companies/123/workspaces/${platform.workspace.workspace_id}/channels`,
        "POST",
        done,
      );
    });

    it("should 400 when workspaceId is not valid", async done => {
      testAccess(
        `${url}/companies/${platform.workspace.company_id}/workspaces/123/channels`,
        "POST",
        done,
      );
    });

    it("should create a channel", async done => {
      const jwtToken = await platform.auth.getJWTToken();
      const channelService = platform.platform.getProvider<ChannelServiceAPI>("channels");

      const response = await platform.app.inject({
        method: "POST",
        url: `${url}/companies/${platform.workspace.company_id}/workspaces/${platform.workspace.workspace_id}/channels`,
        headers: {
          authorization: `Bearer ${jwtToken}`,
        },
        payload: {
          resource: {
            name: "Test channel",
          },
        },
      });

      expect(response.statusCode).toEqual(201);

      const channelCreateResult: ResourceGetResponse<Channel> = deserialize(
        ResourceGetResponse,
        response.body,
      );

      expect(channelCreateResult.resource).toBeDefined();
      expect(channelCreateResult.websocket).toBeDefined();

      const channelId = channelCreateResult.resource.id;
      const createdChannel = await channelService.channels.get({ id: channelId });

      expect(channelCreateResult.websocket).toMatchObject({
        room: `/channels/${createdChannel.id}`,
        encryption_key: "",
      });
      expect(createdChannel).toBeDefined();
      done();
    });

    it("should fail when channel name is not defined", async done => {
      const jwtToken = await platform.auth.getJWTToken();
      const response = await platform.app.inject({
        method: "POST",
        url: `${url}/companies/${platform.workspace.company_id}/workspaces/${platform.workspace.workspace_id}/channels`,
        headers: {
          authorization: `Bearer ${jwtToken}`,
        },
        payload: {
          resource: {
            description: "The channel description",
          },
        },
      });

      expect(response.statusCode).toEqual(400);
      done();
    });
  });

  describe("The POST /companies/:companyId/workspaces/:workspaceId/channels/:id route", () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    async function updateChannel(jwtToken: string, id: string, resource: any): Promise<Channel> {
      const channelService = platform.platform.getProvider<ChannelServiceAPI>("channels");
      const response = await platform.app.inject({
        method: "POST",
        url: `${url}/companies/${platform.workspace.company_id}/workspaces/${platform.workspace.workspace_id}/channels/${id}`,
        headers: {
          authorization: `Bearer ${jwtToken}`,
        },
        payload: {
          resource,
        },
      });

      const channelUpdateResult: ResourceUpdateResponse<Channel> = deserialize(
        ResourceUpdateResponse,
        response.body,
      );

      expect(channelUpdateResult.resource).toBeDefined();
      expect(channelUpdateResult.websocket).toBeDefined();

      return await channelService.channels.get({ id });
    }

    async function updateChannelFail(
      jwtToken: string,
      id: string,
      resource: unknown,
      expectedCode: number,
    ): Promise<void> {
      const response = await platform.app.inject({
        method: "POST",
        url: `${url}/companies/${platform.workspace.company_id}/workspaces/${platform.workspace.workspace_id}/channels/${id}`,
        headers: {
          authorization: `Bearer ${jwtToken}`,
        },
        payload: {
          resource,
        },
      });

      expect(response.statusCode).toEqual(expectedCode);
    }

    it("should 400 when companyId is not valid", async done => {
      testAccess(
        `${url}/companies/123/workspaces/${platform.workspace.workspace_id}/channels/1`,
        "POST",
        done,
      );
    });

    it("should 400 when workspaceId is not valid", async done => {
      testAccess(
        `${url}/companies/${platform.workspace.company_id}/workspaces/123/channels/1`,
        "POST",
        done,
      );
    });

    describe("When user is workspace admin and channel has been created by other user", () => {
      beforeEach(() => {
        platform.currentUser.isWorkspaceAdmin = true;
      });

      it("should fail when resource is not defined", async done => {
        const channelService = platform.platform.getProvider<ChannelServiceAPI>("channels");
        const jwtToken = await platform.auth.getJWTToken();

        const channel = getChannel();
        const creationResult = await channelService.channels.save(
          channel,
          {},
          getContext({ id: channel.owner }),
        );

        await updateChannelFail(jwtToken, creationResult.entity.id, {}, 400);
        done();
      });

      it("should be able to update the is_default field", async done => {
        const channelService = platform.platform.getProvider<ChannelServiceAPI>("channels");
        const jwtToken = await platform.auth.getJWTToken();

        const channel = getChannel();
        const creationResult = await channelService.channels.save(
          channel,
          {},
          getContext({ id: channel.owner }),
        );

        const updatedChannel = await updateChannel(jwtToken, creationResult.entity.id, {
          is_default: true,
        });

        expect(updatedChannel).toMatchObject({
          id: channel.id,
          name: "Test Channel",
          company_id: channel.company_id,
          workspace_id: channel.workspace_id,
          is_default: true,
          visibility: channel.visibility,
          archived: channel.archived,
          owner: channel.owner,
        });
        done();
      });

      it("should be able to update the visibility field", async done => {
        const channelService = platform.platform.getProvider<ChannelServiceAPI>("channels");
        const jwtToken = await platform.auth.getJWTToken();

        const channel = getChannel();
        const creationResult = await channelService.channels.save(
          channel,
          {},
          getContext({ id: channel.owner }),
        );

        const updatedChannel = await updateChannel(jwtToken, creationResult.entity.id, {
          visibility: ChannelVisibility.PUBLIC,
        });

        expect(updatedChannel).toMatchObject({
          id: channel.id,
          name: "Test Channel",
          company_id: channel.company_id,
          workspace_id: channel.workspace_id,
          is_default: channel.is_default,
          visibility: ChannelVisibility.PUBLIC,
          archived: channel.archived,
          owner: channel.owner,
        });
        done();
      });

      it("should be able to update the archived field", async done => {
        const channelService = platform.platform.getProvider<ChannelServiceAPI>("channels");
        const jwtToken = await platform.auth.getJWTToken();

        const channel = getChannel();
        const creationResult = await channelService.channels.save(
          channel,
          {},
          getContext({ id: channel.owner }),
        );

        const updatedChannel = await updateChannel(jwtToken, creationResult.entity.id, {
          archived: true,
        });
        expect(updatedChannel).toMatchObject({
          id: channel.id,
          name: "Test Channel",
          company_id: channel.company_id,
          workspace_id: channel.workspace_id,
          is_default: channel.is_default,
          visibility: channel.visibility,
          archived: true,
          owner: channel.owner,
        });
        done();
      });

      it("should be able to update all the fields at the same time", async done => {
        const channelService = platform.platform.getProvider<ChannelServiceAPI>("channels");
        const jwtToken = await platform.auth.getJWTToken();

        const channel = getChannel();
        const creationResult = await channelService.channels.save(
          channel,
          {},
          getContext({ id: channel.owner }),
        );

        const updatedChannel = await updateChannel(jwtToken, creationResult.entity.id, {
          visibility: ChannelVisibility.PUBLIC,
          is_default: true,
          archived: true,
        });

        expect(updatedChannel).toMatchObject({
          id: channel.id,
          name: "Test Channel",
          company_id: channel.company_id,
          workspace_id: channel.workspace_id,
          is_default: true,
          visibility: ChannelVisibility.PUBLIC,
          archived: true,
          owner: channel.owner,
        });

        done();
      });
    });

    describe("When user is channel owner", () => {
      beforeEach(() => {
        platform.currentUser.isWorkspaceAdmin = false;
      });

      it("should be able to update the is_default field", async done => {
        const channelService = platform.platform.getProvider<ChannelServiceAPI>("channels");
        const jwtToken = await platform.auth.getJWTToken();

        const channel = getChannel(platform.currentUser.id);
        const creationResult = await channelService.channels.save(
          channel,
          {},
          getContext({ id: channel.owner }),
        );

        const updatedChannel = await updateChannel(jwtToken, creationResult.entity.id, {
          is_default: true,
        });

        expect(updatedChannel).toMatchObject({
          id: channel.id,
          name: "Test Channel",
          company_id: channel.company_id,
          workspace_id: channel.workspace_id,
          is_default: true,
          visibility: channel.visibility,
          archived: channel.archived,
          owner: channel.owner,
        });

        done();
      });

      it("should be able to update the visibility field", async done => {
        const channelService = platform.platform.getProvider<ChannelServiceAPI>("channels");
        const jwtToken = await platform.auth.getJWTToken();

        const channel = getChannel(platform.currentUser.id);
        const creationResult = await channelService.channels.save(
          channel,
          {},
          getContext({ id: channel.owner }),
        );

        const updatedChannel = await updateChannel(jwtToken, creationResult.entity.id, {
          visibility: ChannelVisibility.PUBLIC,
        });

        expect(updatedChannel).toMatchObject({
          id: channel.id,
          name: "Test Channel",
          company_id: channel.company_id,
          workspace_id: channel.workspace_id,
          is_default: channel.is_default,
          visibility: ChannelVisibility.PUBLIC,
          archived: channel.archived,
          owner: channel.owner,
        });

        done();
      });

      it("should be able to update the archived field", async done => {
        const channelService = platform.platform.getProvider<ChannelServiceAPI>("channels");
        const jwtToken = await platform.auth.getJWTToken();

        const channel = getChannel(platform.currentUser.id);
        const creationResult = await channelService.channels.save(
          channel,
          {},
          getContext({ id: channel.owner }),
        );

        const updatedChannel = await updateChannel(jwtToken, creationResult.entity.id, {
          archived: true,
        });

        expect(updatedChannel).toMatchObject({
          id: channel.id,
          name: "Test Channel",
          company_id: channel.company_id,
          workspace_id: channel.workspace_id,
          is_default: channel.is_default,
          visibility: channel.visibility,
          archived: true,
          owner: channel.owner,
        });
        done();
      });

      it("should be able to update all the fields at the same time", async done => {
        const channelService = platform.platform.getProvider<ChannelServiceAPI>("channels");
        const jwtToken = await platform.auth.getJWTToken();

        const channel = getChannel(platform.currentUser.id);
        const creationResult = await channelService.channels.save(
          channel,
          {},
          getContext({ id: channel.owner }),
        );

        const updatedChannel = await updateChannel(jwtToken, creationResult.entity.id, {
          visibility: ChannelVisibility.PUBLIC,
          is_default: true,
          archived: true,
        });

        expect(updatedChannel).toMatchObject({
          id: channel.id,
          name: "Test Channel",
          company_id: channel.company_id,
          workspace_id: channel.workspace_id,
          is_default: true,
          visibility: ChannelVisibility.PUBLIC,
          archived: true,
          owner: channel.owner,
        });

        done();
      });
    });

    describe("When user is 'standard' user and is not channel owner", () => {
      beforeEach(() => {
        platform.currentUser.isWorkspaceAdmin = false;
      });

      it("should not be able to update the is_default field", async done => {
        const channelService = platform.platform.getProvider<ChannelServiceAPI>("channels");
        const jwtToken = await platform.auth.getJWTToken();

        const channel = getChannel();
        const creationResult = await channelService.channels.save(
          channel,
          {},
          getContext({ id: channel.owner }),
        );

        await updateChannelFail(
          jwtToken,
          creationResult.entity.id,
          {
            is_default: true,
          },
          400,
        );

        done();
      });

      it("should not be able to update the visibility field", async done => {
        const channelService = platform.platform.getProvider<ChannelServiceAPI>("channels");
        const jwtToken = await platform.auth.getJWTToken();

        const channel = getChannel();
        const creationResult = await channelService.channels.save(
          channel,
          {},
          getContext({ id: channel.owner }),
        );

        await updateChannelFail(
          jwtToken,
          creationResult.entity.id,
          {
            visibility: ChannelVisibility.PUBLIC,
          },
          400,
        );

        done();
      });

      it("should not be able to update the archived field", async done => {
        const channelService = platform.platform.getProvider<ChannelServiceAPI>("channels");
        const jwtToken = await platform.auth.getJWTToken();

        const channel = getChannel();
        const creationResult = await channelService.channels.save(
          channel,
          {},
          getContext({ id: channel.owner }),
        );

        await updateChannelFail(
          jwtToken,
          creationResult.entity.id,
          {
            archived: true,
          },
          400,
        );

        done();
      });

      it("should be able to update the 'name', 'description', 'icon' fields", async done => {
        const channelService = platform.platform.getProvider<ChannelServiceAPI>("channels");
        const jwtToken = await platform.auth.getJWTToken();

        const channel = getChannel();
        const creationResult = await channelService.channels.save(
          channel,
          {},
          getContext({ id: channel.owner }),
        );

        const updatedChannel = await updateChannel(jwtToken, creationResult.entity.id, {
          name: "This is a new name",
          description: "This is a new description",
          icon: "This is a new icon",
        });

        expect(updatedChannel).toMatchObject({
          id: channel.id,
          name: "This is a new name",
          description: "This is a new description",
          icon: "This is a new icon",
          company_id: channel.company_id,
          workspace_id: channel.workspace_id,
          is_default: channel.is_default,
          visibility: channel.visibility,
          archived: channel.archived,
          owner: channel.owner,
        });

        done();
      });
    });
  });

  describe("The DELETE /companies/:companyId/workspaces/:workspaceId/channels/:id route", () => {
    async function expectDeleteResult(
      jwtToken: string,
      url: string,
      status: number,
    ): Promise<void> {
      const response = await platform.app.inject({
        method: "DELETE",
        url,
        headers: {
          authorization: `Bearer ${jwtToken}`,
        },
      });

      expect(response.statusCode).toEqual(status);
    }

    it("should 400 when companyId is not valid", async done => {
      testAccess(
        `${url}/companies/123/workspaces/${platform.workspace.workspace_id}/channels/1`,
        "DELETE",
        done,
      );
    });

    it("should 400 when workspaceId is not valid", async done => {
      testAccess(
        `${url}/companies/${platform.workspace.company_id}/workspaces/123/channels/1`,
        "DELETE",
        done,
      );
    });

    describe("When user is workspace administrator", () => {
      beforeEach(() => {
        platform.currentUser.isWorkspaceAdmin = true;
      });

      it("should not be able to delete a direct channel", async done => {
        platform.workspace.workspace_id = "direct";
        const jwtToken = await platform.auth.getJWTToken();
        const channelService = platform.platform.getProvider<ChannelServiceAPI>("channels");
        const channel = getChannel();

        const creationResult = await channelService.channels.save(
          channel,
          {},
          getContext({ id: channel.owner }),
        );

        await expectDeleteResult(
          jwtToken,
          `${url}/companies/${platform.workspace.company_id}/workspaces/${platform.workspace.workspace_id}/channels/${creationResult.entity.id}`,
          400,
        );
        done();
      });

      it("should be able to delete any channel of the workspace", async done => {
        const jwtToken = await platform.auth.getJWTToken();
        const channelService = platform.platform.getProvider<ChannelServiceAPI>("channels");
        const channel = getChannel();

        const creationResult = await channelService.channels.save(
          channel,
          {},
          getContext({ id: channel.owner }),
        );

        await expectDeleteResult(
          jwtToken,
          `${url}/companies/${platform.workspace.company_id}/workspaces/${platform.workspace.workspace_id}/channels/${creationResult.entity.id}`,
          204,
        );
        done();
      });
    });

    describe("When user is channel owner", () => {
      beforeEach(() => {
        platform.currentUser.isWorkspaceAdmin = false;
      });

      it("should not be able to delete a direct channel", async done => {
        platform.workspace.workspace_id = "direct";
        const jwtToken = await platform.auth.getJWTToken();
        const channelService = platform.platform.getProvider<ChannelServiceAPI>("channels");
        const channel = getChannel(platform.currentUser.id);

        const creationResult = await channelService.channels.save(
          channel,
          {},
          getContext({ id: channel.owner }),
        );

        await expectDeleteResult(
          jwtToken,
          `${url}/companies/${platform.workspace.company_id}/workspaces/${platform.workspace.workspace_id}/channels/${creationResult.entity.id}`,
          400,
        );
        done();
      });

      it("should be able to delete the channel", async done => {
        const jwtToken = await platform.auth.getJWTToken();
        const channelService = platform.platform.getProvider<ChannelServiceAPI>("channels");
        const channel = getChannel(platform.currentUser.id);

        const creationResult = await channelService.channels.save(
          channel,
          {},
          getContext({ id: channel.owner }),
        );

        await expectDeleteResult(
          jwtToken,
          `${url}/companies/${platform.workspace.company_id}/workspaces/${platform.workspace.workspace_id}/channels/${creationResult.entity.id}`,
          204,
        );
        done();
      });
    });

    describe("When user is not creator nor workspace administrator", () => {
      beforeEach(() => {
        platform.currentUser.isWorkspaceAdmin = false;
      });

      it("should not be able to delete the channel", async done => {
        const jwtToken = await platform.auth.getJWTToken();
        const channelService = platform.platform.getProvider<ChannelServiceAPI>("channels");
        const channel = getChannel();

        const creationResult = await channelService.channels.save(
          channel,
          {},
          getContext({ id: channel.owner }),
        );

        await expectDeleteResult(
          jwtToken,
          `${url}/companies/${platform.workspace.company_id}/workspaces/${platform.workspace.workspace_id}/channels/${creationResult.entity.id}`,
          400,
        );
        done();
      });

      it("should not be able to delete a direct channel", async done => {
        platform.workspace.workspace_id = "direct";
        const jwtToken = await platform.auth.getJWTToken();
        const channelService = platform.platform.getProvider<ChannelServiceAPI>("channels");
        const channel = getChannel();

        const creationResult = await channelService.channels.save(
          channel,
          {},
          getContext({ id: channel.owner }),
        );

        await expectDeleteResult(
          jwtToken,
          `${url}/companies/${platform.workspace.company_id}/workspaces/${platform.workspace.workspace_id}/channels/${creationResult.entity.id}`,
          400,
        );
        done();
      });
    });
  });
});

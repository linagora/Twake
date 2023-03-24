import { afterEach, beforeAll, beforeEach, describe, expect, it } from "@jest/globals";
import { v1 as uuidv1 } from "uuid";
import { deserialize } from "class-transformer";
import { init, TestPlatform } from "../setup";
import {
  ResourceGetResponse,
  ResourceListResponse,
  ResourceUpdateResponse,
  User,
  Workspace,
} from "../../../src/utils/types";
import { Channel, ChannelMember } from "../../../src/services/channels/entities";
import {
  ChannelExecutionContext,
  ChannelVisibility,
  WorkspaceExecutionContext,
} from "../../../src/services/channels/types";
import {
  getPrivateRoomName,
  getPublicRoomName,
} from "../../../src/services/channels/services/channel/realtime";
import { ChannelUtils, get as getChannelUtils } from "./utils";
import { TestDbService } from "../utils.prepare.db";
import { ChannelObject } from "../../../src/services/channels/services/channel/types";
import { Api } from "../utils.api";
import gr from "../../../src/services/global-resolver";
import { createMessage, e2e_createMessage, e2e_createThread } from "../messages/utils";
import { ChannelSaveOptions } from "../../../src/services/channels/web/types";
import { ParticipantObject, Thread } from "../../../src/services/messages/entities/threads";

describe("The /internal/services/channels/v1 API", () => {
  const url = "/internal/services/channels/v1";
  let platform: TestPlatform;
  let channelUtils: ChannelUtils;
  let testDbService: TestDbService;
  let api: Api;

  beforeAll(async end => {
    // platform = await init();
    // await platform.database.getConnector().drop();
    end();
  });

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
      const channel = new Channel();
      channel.name = "Test Channel";
      const creationResult = await gr.services.channels.channels.save(channel, {}, getContext());

      const jwtToken = await platform.auth.getJWTToken();
      const response = await platform.app.inject({
        method: "GET",
        url: `${url}/companies/${platform.workspace.company_id}/workspaces/${platform.workspace.workspace_id}/channels`,
        headers: {
          authorization: `Bearer ${jwtToken}`,
        },
      });

      const result: ResourceListResponse<ChannelObject> = deserialize(
        ResourceListResponse,
        response.body,
      );

      expect(response.statusCode).toBe(200);
      expect(result.resources.length).toEqual(1);
      expect(result.resources[0]).toMatchObject({
        id: creationResult.entity.id,
        name: channel.name,
      });

      result.resources.forEach(r => {
        expect(r.stats).toMatchObject({
          members: 1,
          messages: 0,
        });
      });

      done();
    });

    it("should return list of channels the user is member of", async done => {
      const ws0pk = { id: uuidv1(), company_id: platform.workspace.company_id };
      await testDbService.createWorkspace(ws0pk);
      const newUser = await testDbService.createUser([ws0pk]);

      const channel1 = getChannel();
      const channel2 = getChannel();

      channel1.name = "Test Channel1";
      channel2.name = "Test Channel2";

      const creationResults = await Promise.all([
        gr.services.channels.channels.save(channel1, {}, getContext()),
        gr.services.channels.channels.save(channel2, {}, getContext()),
      ]);

      await gr.services.channels.members.save(
        {
          channel_id: channel1.id,
          workspace_id: channel1.workspace_id,
          company_id: channel1.company_id,
          user_id: newUser.id,
        } as ChannelMember,
        channelUtils.getChannelContext(channel1, platform.currentUser),
      );

      const jwtToken = await platform.auth.getJWTToken({ sub: newUser.id });
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
      await Promise.all(
        "0123456789".split("").map(name => {
          const channel = new Channel();
          channel.name = name;
          return gr.services.channels.channels.save(channel, {}, getContext());
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
      await platform.database.getConnector().drop();

      await Promise.all(
        "0123456789".split("").map(name => {
          const channel = new Channel();
          channel.name = name;
          return gr.services.channels.channels.save(channel, {}, getContext());
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
      await Promise.all(
        "0123456789".split("").map(name => {
          const channel = new Channel();
          channel.name = name;
          return gr.services.channels.channels.save(channel, {}, getContext());
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

    it.skip("should return websockets and direct information", async done => {
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

      const channel = new Channel();
      channel.name = "Test Channel";
      channel.company_id = platform.workspace.company_id;
      channel.workspace_id = platform.workspace.workspace_id;

      const creationResult = await gr.services.channels.channels.save(channel, {}, getContext());
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
        token: expect.any(String),
      });

      done();
    });

    it("channel counters", async done => {
      await platform.database.getConnector().drop();

      await testDbService.createDefault(platform);

      const channel = new Channel();
      channel.name = "Test counters Channel";
      channel.company_id = platform.workspace.company_id;
      channel.workspace_id = platform.workspace.workspace_id;
      channel.is_default = true;
      channel.visibility = ChannelVisibility.PUBLIC;
      channel.description = "test counters";
      channel.channel_group = "my channel group";

      const creationResult = await gr.services.channels.channels.save(channel, {}, getContext());

      const channelId = creationResult.entity.id;

      let resource = await getChannelREST(channelId);

      expect(resource).toMatchObject({
        company_id: platform.workspace.company_id,
        workspace_id: platform.workspace.workspace_id,
        // type: expect.stringMatching(/workspace|direct/), // TODO
        id: expect.any(String),
        icon: expect.any(String),
        name: channel.name,
        description: channel.description,
        channel_group: channel.channel_group,
        visibility: channel.visibility,
        default: channel.is_default,
        owner: platform.currentUser.id,
        last_activity: expect.any(Number),
        archived: false,
        archivation_date: 0, //Timestamp
        user_member: expect.any(Object),
        stats: expect.any(Object),
      });

      expect(resource.stats).toMatchObject({
        members: 1,
        messages: 0,
      });

      expect(resource.user_member).toMatchObject({
        id: expect.any(String),
        user_id: platform.currentUser.id,
        type: expect.stringMatching(/member|guest|bot/),
        last_access: 0, //Timestamp in seconds
        last_increment: 0, //Number
        favorite: false,
        // notification_level: "all" | "none" | "group_mentions" | "user_mentions",  // TODO
      });

      const anotherUserId = uuidv1();
      await gr.services.channels.members.addUsersToChannel(
        [
          { id: anotherUserId },
          { id: uuidv1() },
          { id: uuidv1() },
          { id: uuidv1() },
          { id: uuidv1() },
        ],
        creationResult.entity,
        {
          user: { id: platform.currentUser.id },
        },
      );

      resource = await getChannelREST(channelId);

      expect(resource.stats).toMatchObject({
        members: 6,
        messages: 0,
      });

      await gr.services.channels.members.delete(
        {
          ...platform.workspace,
          channel_id: channelId,
          user_id: anotherUserId,
        },
        { channel: creationResult.entity, user: platform.currentUser } as ChannelExecutionContext,
      );

      resource = await getChannelREST(channelId);

      expect(resource.stats).toMatchObject({
        members: 5,
        messages: 0,
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

      const channelCreateResult: ResourceGetResponse<ChannelObject> = deserialize(
        ResourceGetResponse,
        response.body,
      );

      expect(channelCreateResult.resource).toBeDefined();
      expect(channelCreateResult.websocket).toBeDefined();

      const res = channelCreateResult.resource;

      const createdChannel = await gr.services.channels.channels.get({
        company_id: res.company_id,
        workspace_id: res.workspace_id,
        id: res.id,
      });

      expect(channelCreateResult.websocket).toMatchObject({
        room: `/channels/${createdChannel.id}`,
        token: expect.any(String),
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

  describe.skip("The POST /companies/:companyId/workspaces/:workspaceId/channels/:id route", () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    async function updateChannel(jwtToken: string, id: string, resource: any): Promise<Channel> {
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

      return await gr.services.channels.channels.get({
        id,
        company_id: platform.workspace.company_id,
        workspace_id: platform.workspace.workspace_id,
      });
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

    describe("When user is workspace moderator and channel has been created by other user", () => {
      beforeEach(() => {
        platform.currentUser.isWorkspaceModerator = true;
      });

      it("should fail when resource is not defined", async done => {
        const jwtToken = await platform.auth.getJWTToken();

        const channel = getChannel();
        const creationResult = await gr.services.channels.channels.save(
          channel,
          {},
          getContext({ id: channel.owner }),
        );

        await updateChannelFail(jwtToken, creationResult.entity.id, {}, 400);
        done();
      });

      it("should be able to update the is_default field", async done => {
        const jwtToken = await platform.auth.getJWTToken();

        const channel = getChannel();
        const creationResult = await gr.services.channels.channels.save(
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
        const jwtToken = await platform.auth.getJWTToken();

        const channel = getChannel();
        const creationResult = await gr.services.channels.channels.save(
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
        const jwtToken = await platform.auth.getJWTToken();

        const channel = getChannel();
        const creationResult = await gr.services.channels.channels.save(
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
        const jwtToken = await platform.auth.getJWTToken();

        const channel = getChannel();
        const creationResult = await gr.services.channels.channels.save(
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
        platform.currentUser.isWorkspaceModerator = false;
      });

      it("should be able to update the is_default field", async done => {
        const jwtToken = await platform.auth.getJWTToken();

        const channel = getChannel(platform.currentUser.id);
        const creationResult = await gr.services.channels.channels.save(
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
        const jwtToken = await platform.auth.getJWTToken();

        const channel = getChannel(platform.currentUser.id);
        const creationResult = await gr.services.channels.channels.save(
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
        const jwtToken = await platform.auth.getJWTToken();

        const channel = getChannel(platform.currentUser.id);
        const creationResult = await gr.services.channels.channels.save(
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
        const jwtToken = await platform.auth.getJWTToken();

        const channel = getChannel(platform.currentUser.id);
        const creationResult = await gr.services.channels.channels.save(
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
        platform.currentUser.isWorkspaceModerator = false;
      });

      it("should not be able to update the is_default field", async done => {
        const jwtToken = await platform.auth.getJWTToken();

        const channel = getChannel();
        const creationResult = await gr.services.channels.channels.save(
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
        const jwtToken = await platform.auth.getJWTToken();

        const channel = getChannel();
        const creationResult = await gr.services.channels.channels.save(
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
        const jwtToken = await platform.auth.getJWTToken();

        const channel = getChannel();
        const creationResult = await gr.services.channels.channels.save(
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
        const jwtToken = await platform.auth.getJWTToken();

        const channel = getChannel();
        const creationResult = await gr.services.channels.channels.save(
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

  describe.skip("The DELETE /companies/:companyId/workspaces/:workspaceId/channels/:id route", () => {
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

    describe("When user is workspace moderator", () => {
      beforeEach(() => {
        platform.currentUser.isWorkspaceModerator = true;
      });

      it("should not be able to delete a direct channel", async done => {
        platform.workspace.workspace_id = "direct";
        const jwtToken = await platform.auth.getJWTToken();

        const channel = getChannel();

        const creationResult = await gr.services.channels.channels.save(
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

        const channel = getChannel();

        const creationResult = await gr.services.channels.channels.save(
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
        platform.currentUser.isWorkspaceModerator = false;
      });

      it("should not be able to delete a direct channel", async done => {
        platform.workspace.workspace_id = "direct";
        const jwtToken = await platform.auth.getJWTToken();

        const channel = getChannel(platform.currentUser.id);

        const creationResult = await gr.services.channels.channels.save(
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

        const channel = getChannel(platform.currentUser.id);

        const creationResult = await gr.services.channels.channels.save(
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

    describe("When user is not creator nor workspace moderator", () => {
      beforeEach(() => {
        platform.currentUser.isWorkspaceModerator = false;
      });

      it("should not be able to delete the channel", async done => {
        const jwtToken = await platform.auth.getJWTToken();

        const channel = getChannel();

        const creationResult = await gr.services.channels.channels.save(
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

        const channel = getChannel();

        const creationResult = await gr.services.channels.channels.save(
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

  describe("The GET /companies/:companyId/workspaces/:workspaceId/recent route", () => {
    it("should return list of recent channels for workspace", async done => {
      await testDbService.createDefault(platform);

      const channels = [];

      for (let i = 0; i < 5; i++) {
        const channel = new Channel();
        channel.name = `Regular Channel ${i}`;
        channel.visibility = ChannelVisibility.PUBLIC;
        const creationResult = await gr.services.channels.channels.save(channel, {}, getContext());
        channels.push(creationResult.entity);
      }

      for (let i = 0; i < 5; i++) {
        // const channel = channelUtils.getChannel();
        const directChannelIn = channelUtils.getDirectChannel();

        const nextUser = await testDbService.createUser(
          [{ id: platform.workspace.workspace_id, company_id: platform.workspace.company_id }],
          { firstName: "FirstName" + i, lastName: "LastName" + i },
        );

        const members = [platform.currentUser.id, nextUser.id];
        const directWorkspace: Workspace = {
          company_id: platform.workspace.company_id,
          workspace_id: ChannelVisibility.DIRECT,
        };
        await Promise.all([
          // gr.services.channels.channels.save(channel, {}, getContext()),
          gr.services.channels.channels.save(
            directChannelIn,
            {
              members,
            },
            { ...getContext(), ...{ workspace: directWorkspace } },
          ),
        ]);
        channels.push(directChannelIn);
      }

      await new Promise(resolve => setTimeout(resolve, 2000));

      console.log("done awaiting");

      await e2e_createThread(
        platform,
        [
          {
            company_id: platform.workspace.company_id,
            created_at: 0,
            created_by: "",
            id: channels[2].id,
            type: "channel",
            workspace_id: platform.workspace.workspace_id,
          },
        ],
        createMessage({ text: "Initial thread message for regular channel" }),
      );

      await e2e_createThread(
        platform,
        [
          {
            company_id: platform.workspace.company_id,
            created_at: 0,
            created_by: "",
            id: channels[7].id,
            type: "channel",
            workspace_id: "direct",
          },
        ],
        createMessage({ text: "Some message" }),
      );

      await gr.services.channels.channels.markAsRead(channels[2], { id: platform.currentUser.id });
      await gr.services.channels.channels.markAsRead(channels[7], { id: platform.currentUser.id });

      await new Promise(resolve => setTimeout(resolve, 2000));

      const jwtToken = await platform.auth.getJWTToken();

      const response = await platform.app.inject({
        method: "GET",
        url: `${url}/companies/${platform.workspace.company_id}/channels/recent`,
        headers: {
          authorization: `Bearer ${jwtToken}`,
        },
      });

      expect(response.statusCode).toBe(200);

      const result: ResourceListResponse<ChannelObject> = deserialize(
        ResourceListResponse,
        response.body,
      );

      console.log(result.resources[0]);
      console.log(result.resources.map(a => `${a.name} — ${a.last_activity}`));

      expect(result.resources.length).toEqual(10);

      expect(result.resources[0].name).toEqual("FirstName2 LastName2");
      expect(result.resources[1].name).toEqual("Regular Channel 2");

      done();
    });
  });
});

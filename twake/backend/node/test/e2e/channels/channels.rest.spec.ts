import { describe, expect, it, beforeEach, afterEach } from "@jest/globals";
import { deserialize } from "class-transformer";
import { TestPlatform, init } from "../setup";
import {
  ChannelListResponse,
  ChannelGetResponse,
  ChannelCreateResponse,
  ChannelDeleteResponse,
  ChannelUpdateResponse,
} from "../../../src/services/channels/web/types";
import ChannelServiceAPI from "../../../src/services/channels/provider";
import { Channel } from "../../../src/services/channels/entities";
import { getPrivateRoomName, getPublicRoomName } from "../../../src/services/channels/realtime";

describe("The /api/channels API", () => {
  const url = "/api/channels";
  let platform: TestPlatform;

  beforeEach(async () => {
    platform = await init({
      services: ["websocket", "webserver", "channels", "auth", "database"],
    });
  });

  afterEach(async () => {
    await platform.tearDown();
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

      const result = deserialize(ChannelListResponse, response.body);

      expect(response.statusCode).toBe(200);
      expect(result.resources.length).toEqual(0);

      done();
    });

    it("should return list of channels the user has access to", async done => {
      const channelService = platform.platform.getProvider<ChannelServiceAPI>("channels");
      const channel = new Channel();
      channel.name = "Test Channel";
      const creationResult = await channelService.save(channel);

      const jwtToken = await platform.auth.getJWTToken();
      const response = await platform.app.inject({
        method: "GET",
        url: `${url}/companies/${platform.workspace.company_id}/workspaces/${platform.workspace.workspace_id}/channels`,
        headers: {
          authorization: `Bearer ${jwtToken}`,
        },
      });

      const result = deserialize(ChannelListResponse, response.body);

      expect(response.statusCode).toBe(200);
      expect(result.resources.length).toEqual(1);
      expect(result.resources[0]).toMatchObject({
        id: creationResult.entity.id,
        name: channel.name,
      });

      done();
    });

    it("should return pagination information when not all channels are returned", async done => {
      const channelService = platform.platform.getProvider<ChannelServiceAPI>("channels");

      await Promise.all(
        "0123456789".split("").map(name => {
          const channel = new Channel();
          channel.name = name;
          return channelService.save(channel);
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
          max_results: "5",
        },
      });

      const result = deserialize(ChannelListResponse, response.body);

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
          return channelService.save(channel);
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
          max_results: "5",
        },
      });

      const firstPageChannels = deserialize(ChannelListResponse, firstPage.body);

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
          max_results: "5",
          page_token: nextPage,
        },
      });

      const secondPageChannels = deserialize(ChannelListResponse, secondPage.body);

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
          return channelService.save(channel);
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
          max_results: "11",
        },
      });

      const result = deserialize(ChannelListResponse, response.body);

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

      const result = deserialize(ChannelListResponse, response.body);

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

      const result = deserialize(ChannelListResponse, response.body);

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

      const creationResult = await channelService.save(channel);
      const response = await platform.app.inject({
        method: "GET",
        url: `${url}/companies/${platform.workspace.company_id}/workspaces/${platform.workspace.workspace_id}/channels/${creationResult.entity.id}`,
        headers: {
          authorization: `Bearer ${jwtToken}`,
        },
      });

      expect(response.statusCode).toEqual(200);

      const channelGetResult = deserialize(ChannelGetResponse, response.body);

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

      const channelCreateResult = deserialize(ChannelCreateResponse, response.body);

      expect(channelCreateResult.resource).toBeDefined();
      expect(channelCreateResult.websocket).toBeDefined();

      const channelId = channelCreateResult.resource.id;
      const createdChannel = await channelService.get({ id: channelId });

      expect(channelCreateResult.websocket).toMatchObject({
        room: `/channels/${createdChannel.id}`,
        encryption_key: "",
      });
      expect(createdChannel).toBeDefined();
      done();
    });
  });

  describe("The POST /companies/:companyId/workspaces/:workspaceId/channels/:id route", () => {
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

    it("should update an existing channel", async done => {
      const jwtToken = await platform.auth.getJWTToken();
      const channelService = platform.platform.getProvider<ChannelServiceAPI>("channels");
      const channel = new Channel();
      channel.name = "Test Channel";
      channel.company_id = platform.workspace.company_id;
      channel.workspace_id = platform.workspace.workspace_id;

      const creationResult = await channelService.save(channel);
      const response = await platform.app.inject({
        method: "POST",
        url: `${url}/companies/${platform.workspace.company_id}/workspaces/${platform.workspace.workspace_id}/channels/${creationResult.entity.id}`,
        headers: {
          authorization: `Bearer ${jwtToken}`,
        },
        payload: {
          resource: {
            name: "Update the channel name",
          },
        },
      });

      const channelUpdateResult = deserialize(ChannelUpdateResponse, response.body);

      expect(channelUpdateResult.resource).toBeDefined();
      expect(channelUpdateResult.websocket).toBeDefined();

      const channelId = channelUpdateResult.resource.id;
      const updatedChannel = await channelService.get({ id: channelId });

      expect(updatedChannel.name).toEqual("Update the channel name");
      done();
    });
  });

  describe("The DELETE /companies/:companyId/workspaces/:workspaceId/channels/:id route", () => {
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

    it("should delete a channel", async done => {
      const jwtToken = await platform.auth.getJWTToken();
      const channelService = platform.platform.getProvider<ChannelServiceAPI>("channels");
      const channel = new Channel();
      channel.name = "Test Channel";
      channel.company_id = platform.workspace.company_id;
      channel.workspace_id = platform.workspace.workspace_id;

      const creationResult = await channelService.save(channel);

      const response = await platform.app.inject({
        method: "DELETE",
        url: `${url}/companies/${platform.workspace.company_id}/workspaces/${platform.workspace.workspace_id}/channels/${creationResult.entity.id}`,
        headers: {
          authorization: `Bearer ${jwtToken}`,
        },
      });

      expect(response.statusCode).toEqual(204);
      const channelDeleteResult = deserialize(ChannelDeleteResponse, response.body);

      expect(channelDeleteResult.status === "success");

      const deleteChannel = await channelService.get({ id: creationResult.entity.id });

      expect(deleteChannel).toBeNull();
      done();
    });
  });
});

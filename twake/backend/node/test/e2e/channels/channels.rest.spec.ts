import {describe, expect, it, beforeEach, afterEach} from "@jest/globals";
import { deserialize } from "class-transformer";
import { TestPlatform, init } from "../setup";
import { ChannelListResponse, ChannelGetResponse, ChannelCreateResponse, ChannelDeleteResponse } from "../../../src/services/channels/web/types";
import ChannelServiceAPI from "../../../src/services/channels/provider";
import { Channel } from "../../../src/services/channels/entities";

describe("The /api/channels API", () => {
  const url = "/api/channels";
  let platform: TestPlatform;

  beforeEach(async () => {
    platform = await init({
      services: ["websocket", "webserver", "channels", "auth", "database"]
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
        authorization: `Bearer ${jwtToken}`
      }
    });

    expect(response.statusCode).toBe(400);
    done();
  }

  describe("The GET /companies/:companyId/workspaces/:workspaceId/channels route", () => {
    it("should 400 when companyId is not valid", async (done) => {
      const companyId = "123";
      const workspaceId = "0";

      testAccess(`${url}/companies/${companyId}/workspaces/${workspaceId}/channels`, "GET", done);
    });

    it("should 400 when workspaceId is not valid", async (done) => {
      const companyId = "0";
      const workspaceId = "123";

      testAccess(`${url}/companies/${companyId}/workspaces/${workspaceId}/channels`, "GET", done);
    });

    it("should return empty list of channels", async (done) => {
      const companyId = "0";
      const workspaceId = "0";

      const jwtToken = await platform.auth.getJWTToken();
      const response = await platform.app.inject({
        method: "GET",
        url: `${url}/companies/${companyId}/workspaces/${workspaceId}/channels`,
        headers: {
          authorization: `Bearer ${jwtToken}`
        }
      });

      const result = deserialize(ChannelListResponse, response.body);

      expect(response.statusCode).toBe(200);
      expect(result.websockets.length).toEqual(0);
      expect(result.resources.length).toEqual(0);

      done();
    });

    it("should return list of channels the user has access to", async (done) => {
      const companyId = "0";
      const workspaceId = "0";

      const channelService = platform.platform.getProvider<ChannelServiceAPI<Channel>>("channels");
      const channel = new Channel();
      channel.name = "Test Channel";
      const creationResult = await channelService.create(channel);

      const jwtToken = await platform.auth.getJWTToken();
      const response = await platform.app.inject({
        method: "GET",
        url: `${url}/companies/${companyId}/workspaces/${workspaceId}/channels`,
        headers: {
          authorization: `Bearer ${jwtToken}`
        }
      });

      const result = deserialize(ChannelListResponse, response.body);

      expect(response.statusCode).toBe(200);
      expect(result.websockets.length).toEqual(1);
      expect(result.resources.length).toEqual(1);
      expect(result.websockets[0]).toMatchObject({ name: creationResult.entity.name, room: `/channels/${creationResult.entity._id}`, encryption_key: ""});
      expect(result.resources[0]).toMatchObject({ _id: String(creationResult.entity._id), name: channel.name });

      done();
    });
  });

  describe("The GET /companies/:companyId/workspaces/:workspaceId/channels/:id route", () => {
    it("should 400 when companyId is not valid", async (done) => {
      const companyId = "123";
      const workspaceId = "0";
      const channelId = "1";

      testAccess(`${url}/companies/${companyId}/workspaces/${workspaceId}/channels/${channelId}`, "GET", done);
    });

    it("should 400 when workspaceId is not valid", async (done) => {
      const companyId = "0";
      const workspaceId = "123";
      const channelId = "1";

      testAccess(`${url}/companies/${companyId}/workspaces/${workspaceId}/channels/${channelId}`, "GET", done);
    });

    it("should return the requested channel", async (done) => {
      const companyId = "0";
      const workspaceId = "0";
      const jwtToken = await platform.auth.getJWTToken();
      const channelService = platform.platform.getProvider<ChannelServiceAPI<Channel>>("channels");
      const channel = new Channel();
      channel.name = "Test Channel";
      channel.company_id = companyId;
      channel.workspace_id = workspaceId;

      const creationResult = await channelService.create(channel);
      const response = await platform.app.inject({
        method: "GET",
        url: `${url}/companies/${companyId}/workspaces/${workspaceId}/channels/${creationResult.entity._id}`,
        headers: {
          authorization: `Bearer ${jwtToken}`
        }
      });

      expect(response.statusCode).toEqual(200);

      const channelGetResult = deserialize(ChannelGetResponse, response.body);

      expect(channelGetResult.resource).toBeDefined();
      expect(channelGetResult.resource).toMatchObject({
        id: String(creationResult.entity._id),
        name: creationResult.entity.name
      });
      expect(channelGetResult.websocket).toBeDefined();
      expect(channelGetResult.websocket).toMatchObject({ name: creationResult.entity.name, room: `/channels/${creationResult.entity._id}`, encryption_key: ""});

      done();
    });
  });

  describe("The POST /companies/:companyId/workspaces/:workspaceId/channels route", () => {
    it("should 400 when companyId is not valid", async (done) => {
      const companyId = "123";
      const workspaceId = "0";

      testAccess(`${url}/companies/${companyId}/workspaces/${workspaceId}/channels`, "POST", done);
    });

    it("should 400 when workspaceId is not valid", async (done) => {
      const companyId = "0";
      const workspaceId = "123";

      testAccess(`${url}/companies/${companyId}/workspaces/${workspaceId}/channels`, "POST", done);
    });

    it("should create a channel", async (done) => {
      const companyId = "0";
      const workspaceId = "0";
      const jwtToken = await platform.auth.getJWTToken();
      const channelService = platform.platform.getProvider<ChannelServiceAPI<Channel>>("channels");

      const response = await platform.app.inject({
        method: "POST",
        url: `${url}/companies/${companyId}/workspaces/${workspaceId}/channels`,
        headers: {
          authorization: `Bearer ${jwtToken}`
        },
        payload: {
          name: "Test channel"
        }
      });

      expect(response.statusCode).toEqual(201);

      const channelCreateResult = deserialize(ChannelCreateResponse, response.body);

      expect(channelCreateResult.resource).toBeDefined();
      expect(channelCreateResult.websocket).toBeDefined();

      const channelId = channelCreateResult.resource.id;
      const createdChannel = await channelService.get(channelId);

      expect(channelCreateResult.websocket).toMatchObject({ room: `/channels/${createdChannel._id}`, encryption_key: ""});
      expect(createdChannel).toBeDefined();
      done();
    });
  });

  describe("The DELETE /companies/:companyId/workspaces/:workspaceId/channels/:id route", () => {
    it("should 400 when companyId is not valid", async (done) => {
      const companyId = "123";
      const workspaceId = "0";

      testAccess(`${url}/companies/${companyId}/workspaces/${workspaceId}/channels/1`, "DELETE", done);
    });

    it("should 400 when workspaceId is not valid", async (done) => {
      const companyId = "0";
      const workspaceId = "123";

      testAccess(`${url}/companies/${companyId}/workspaces/${workspaceId}/channels/1`, "DELETE", done);
    });

    it("should delete a channel", async (done) => {
      const companyId = "0";
      const workspaceId = "0";
      const jwtToken = await platform.auth.getJWTToken();
      const channelService = platform.platform.getProvider<ChannelServiceAPI<Channel>>("channels");
      const channel = new Channel();
      channel.name = "Test Channel";
      channel.company_id = companyId;
      channel.workspace_id = workspaceId;

      const creationResult = await channelService.create(channel);

      const response = await platform.app.inject({
        method: "DELETE",
        url: `${url}/companies/${companyId}/workspaces/${workspaceId}/channels/${creationResult.entity._id}`,
        headers: {
          authorization: `Bearer ${jwtToken}`
        }
      });

      expect(response.statusCode).toEqual(204);
      const channelDeleteResult = deserialize(ChannelDeleteResponse, response.body);

      expect(channelDeleteResult.status === "success");

      const deleteChannel = await channelService.get(String(creationResult.entity._id));

      expect(deleteChannel).toBeNull();
      done();
    });
  });
});

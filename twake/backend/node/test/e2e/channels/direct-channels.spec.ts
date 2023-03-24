import { afterEach, beforeEach, describe, expect, it } from "@jest/globals";
import { v1 as uuidv1 } from "uuid";
import { deserialize } from "class-transformer";
import { init, TestPlatform } from "../setup";
import {
  ResourceCreateResponse,
  ResourceListResponse,
  User,
  Workspace,
} from "../../../src/utils/types";
import { Channel } from "../../../src/services/channels/entities";
import { ChannelVisibility, WorkspaceExecutionContext } from "../../../src/services/channels/types";
import { ChannelUtils, get as getChannelUtils } from "./utils";
import { DirectChannel } from "../../../src/services/channels/entities/direct-channel";
import gr from "../../../src/services/global-resolver";

describe("The direct channels API", () => {
  const url = "/internal/services/channels/v1";
  let platform: TestPlatform;
  let channelUtils: ChannelUtils;

  beforeEach(async () => {
    platform = await init({
      services: [
        "webserver",
        "database",
        "search",
        "storage",
        "message-queue",
        "user",
        "applications",
        "websocket",
        "channels",
        "auth",
        "storage",
        "counter",
        "statistics",
      ],
    });
    channelUtils = getChannelUtils(platform);
  });

  afterEach(async () => {
    await platform.tearDown();
  });

  function getContext(user?: User): WorkspaceExecutionContext {
    return {
      workspace: platform.workspace,
      user: user || platform.currentUser,
    };
  }

  describe("Channel List - GET /channels", () => {
    it("should return empty list of direct channels", async done => {
      const jwtToken = await platform.auth.getJWTToken();
      const response = await platform.app.inject({
        method: "GET",
        url: `${url}/companies/${platform.workspace.company_id}/workspaces/direct/channels`,
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

    it("should return list of direct channels the user is member of", async done => {
      const channel = channelUtils.getChannel();
      const directChannelIn = channelUtils.getDirectChannel();
      const directChannelNotIn = channelUtils.getDirectChannel();
      const members = [platform.currentUser.id, uuidv1()];
      const directWorkspace: Workspace = {
        company_id: platform.workspace.company_id,
        workspace_id: ChannelVisibility.DIRECT,
      };

      const creationResult = await Promise.all([
        gr.services.channels.channels.save(channel, {}, getContext()),
        gr.services.channels.channels.save(
          directChannelIn,
          {
            members,
          },
          { ...getContext(), ...{ workspace: directWorkspace } },
        ),
        gr.services.channels.channels.save(
          directChannelNotIn,
          {
            members: [uuidv1(), uuidv1()],
          },
          { ...getContext({ id: uuidv1() }), ...{ workspace: directWorkspace } },
        ),
      ]);

      const jwtToken = await platform.auth.getJWTToken();
      const directResponse = await platform.app.inject({
        method: "GET",
        url: `${url}/companies/${platform.workspace.company_id}/workspaces/direct/channels`,
        headers: {
          authorization: `Bearer ${jwtToken}`,
        },
      });

      const directResult: ResourceListResponse<Channel> = deserialize(
        ResourceListResponse,
        directResponse.body,
      );

      expect(directResponse.statusCode).toBe(200);
      expect(directResult.resources.length).toEqual(1);

      expect(directResult.resources[0]).toMatchObject({
        id: creationResult[1].entity.id,
        workspace_id: ChannelVisibility.DIRECT,
        user_member: {
          user_id: platform.currentUser.id,
        },
      });

      expect(directResult.resources[0].members).toContain(members[0]);
      expect(directResult.resources[0].members).toContain(members[1]);

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
        id: creationResult[0].entity.id,
      });

      done();
    });

    it("should not return direct channels in workspace list", async done => {
      const channel = channelUtils.getChannel();
      const directChannelIn = channelUtils.getDirectChannel();
      const directChannelIn2 = channelUtils.getDirectChannel();
      const directChannelNotIn = channelUtils.getDirectChannel();
      const members = [platform.currentUser.id, uuidv1()];
      const directWorkspace: Workspace = {
        company_id: platform.workspace.company_id,
        workspace_id: ChannelVisibility.DIRECT,
      };

      const creationResult = await Promise.all([
        //This channel will automatically contains the requester because it is added automatically in it
        gr.services.channels.channels.save(channel, {}, getContext()),

        //It will contain the currentUser
        gr.services.channels.channels.save(
          directChannelIn,
          {
            members,
          },
          { ...getContext({ id: uuidv1() }), ...{ workspace: directWorkspace } },
        ),

        //This channel will automatically contains the requester because it is added automatically in it
        gr.services.channels.channels.save(
          directChannelIn2,
          {
            members: [uuidv1(), uuidv1()],
          },
          { ...getContext(), ...{ workspace: directWorkspace } },
        ),

        //This channel will not contain the currentUser
        gr.services.channels.channels.save(
          directChannelNotIn,
          {
            members: [uuidv1(), uuidv1()],
          },
          { ...getContext({ id: uuidv1() }), ...{ workspace: directWorkspace } },
        ),
      ]);

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
        id: creationResult[0].entity.id,
      });
      expect(result.resources[0].visibility).not.toEqual(ChannelVisibility.DIRECT);

      done();
    });

    it("should not return direct channels in workspace list with mine parameter", async done => {
      const channel = channelUtils.getChannel();
      const channel2 = channelUtils.getChannel();
      const directChannelIn = channelUtils.getDirectChannel();
      const directChannelNotIn = channelUtils.getDirectChannel();
      const members = [platform.currentUser.id, uuidv1()];
      const directWorkspace: Workspace = {
        company_id: platform.workspace.company_id,
        workspace_id: ChannelVisibility.DIRECT,
      };

      await Promise.all([
        //This channel will automatically contains the requester because it is added automatically in it
        gr.services.channels.channels.save(channel, {}, getContext()),

        //This channel will not contain currentUser
        gr.services.channels.channels.save(channel2, {}, getContext({ id: uuidv1() })),

        //This channel will automatically contains the requester because it is added automatically in it
        gr.services.channels.channels.save(
          directChannelIn,
          {
            members,
          },
          { ...getContext(), ...{ workspace: directWorkspace } },
        ),

        gr.services.channels.channels.save(
          directChannelNotIn,
          {
            members: [uuidv1(), uuidv1(), uuidv1()],
          },
          { ...getContext(), ...{ workspace: directWorkspace } },
        ),
      ]);

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

      const result: ResourceListResponse<Channel> = deserialize(
        ResourceListResponse,
        response.body,
      );

      expect(response.statusCode).toBe(200);
      expect(result.resources.length).toEqual(1);

      done();
    });
  });

  describe("Create direct channel - POST /channels", () => {
    it("should be able to create a direct channel with members", async done => {
      const jwtToken = await platform.auth.getJWTToken();

      const members = [uuidv1(), platform.currentUser.id];

      const response = await platform.app.inject({
        method: "POST",
        url: `${url}/companies/${platform.workspace.company_id}/workspaces/direct/channels`,
        headers: {
          authorization: `Bearer ${jwtToken}`,
        },
        payload: {
          options: {
            members,
          },
          resource: {
            description: "A direct channel description",
            visibility: "direct",
          },
        },
      });

      expect(response.statusCode).toEqual(201);

      const channelCreateResult: ResourceCreateResponse<Channel> = deserialize(
        ResourceCreateResponse,
        response.body,
      );

      expect(channelCreateResult.resource).toBeDefined();

      const createdChannel = await gr.services.channels.channels.get({
        id: channelCreateResult.resource.id,
        company_id: channelCreateResult.resource.company_id,
        workspace_id: ChannelVisibility.DIRECT,
      });
      expect(createdChannel).toBeDefined();

      const directChannelEntity = await gr.services.channels.channels.getDirectChannel({
        channel_id: createdChannel.id,
        company_id: createdChannel.company_id,
        users: DirectChannel.getUsersAsString(members),
      });
      expect(directChannelEntity).toBeDefined();

      const directChannelsInCompany = await gr.services.channels.channels.getDirectChannelInCompany(
        createdChannel.company_id,
        members,
      );
      expect(directChannelsInCompany).toBeDefined();

      done();
    });

    it("should not be able to create the same direct channel twice (with same users)", async done => {
      function createChannel(members: string[]) {
        return platform.app.inject({
          method: "POST",
          url: `${url}/companies/${platform.workspace.company_id}/workspaces/direct/channels`,
          headers: {
            authorization: `Bearer ${jwtToken}`,
          },
          payload: {
            options: {
              members,
            },
            resource: {
              name: "Hello",
              visibility: "direct",
            },
          },
        });
      }

      const jwtToken = await platform.auth.getJWTToken();
      const members = [uuidv1(), platform.currentUser.id];
      const ids = new Set<string>();

      let response = await createChannel(members);
      expect(response.statusCode).toEqual(201);
      let channelCreateResult: ResourceCreateResponse<Channel> = deserialize(
        ResourceCreateResponse,
        response.body,
      );
      ids.add(channelCreateResult.resource.id);

      response = await createChannel(members);
      expect(response.statusCode).toEqual(201);
      channelCreateResult = deserialize(ResourceCreateResponse, response.body);
      ids.add(channelCreateResult.resource.id);

      expect(ids.size).toEqual(1);

      done();
    });

    it("should not be able to create the same direct channel twice (with same users not in the same order)", async done => {
      function createChannel(members: string[]) {
        return platform.app.inject({
          method: "POST",
          url: `${url}/companies/${platform.workspace.company_id}/workspaces/direct/channels`,
          headers: {
            authorization: `Bearer ${jwtToken}`,
          },
          payload: {
            options: {
              members,
            },
            resource: {
              name: "Hello",
              visibility: "direct",
            },
          },
        });
      }

      const jwtToken = await platform.auth.getJWTToken();
      const members = [uuidv1(), platform.currentUser.id];
      const ids = new Set<string>();

      let response = await createChannel(members);
      expect(response.statusCode).toEqual(201);
      let channelCreateResult: ResourceCreateResponse<Channel> = deserialize(
        ResourceCreateResponse,
        response.body,
      );
      ids.add(channelCreateResult.resource.id);

      response = await createChannel(members.reverse());
      expect(response.statusCode).toEqual(201);
      channelCreateResult = deserialize(ResourceCreateResponse, response.body);
      ids.add(channelCreateResult.resource.id);

      expect(ids.size).toEqual(1);

      done();
    });
  });
});

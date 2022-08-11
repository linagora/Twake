import { afterEach, beforeEach, describe, expect, it } from "@jest/globals";
import { v1 as uuidv1, v4 as uuidv4 } from "uuid";
import { deserialize } from "class-transformer";
import { init, TestPlatform } from "../setup";
import { Channel } from "../../../src/services/channels/entities/channel";
import { ChannelMember } from "../../../src/services/channels/entities/channel-member";
import {
  ChannelExecutionContext,
  ChannelVisibility,
  WorkspaceExecutionContext,
} from "../../../src/services/channels/types";
import { ResourceGetResponse, ResourceListResponse, User } from "../../../src/utils/types";
import gr from "../../../src/services/global-resolver";

describe.skip("The ChannelMembers REST API", () => {
  const url = "/internal/services/channels/v1";
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

  function getWorkspaceContext(user?: User): WorkspaceExecutionContext {
    return {
      workspace: platform.workspace,
      user: user || platform.currentUser,
    };
  }

  function getContext(channel: Channel, user?: User): ChannelExecutionContext {
    return {
      channel,
      user,
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

  function getMember(channel: Channel, user: User): ChannelMember {
    const member = new ChannelMember();

    member.company_id = platform.workspace.company_id;
    member.workspace_id = platform.workspace.workspace_id;
    member.channel_id = channel?.id;
    member.user_id = user?.id;

    return member;
  }

  describe("The GET / - Get members list", () => {
    let channel;
    let createdChannel;

    beforeEach(async () => {
      channel = getChannel();
      createdChannel = await gr.services.channels.channels.save(channel, {}, getWorkspaceContext());
    });

    it("should 404 when channel does not exists", done => {
      done();
    });

    it("should return empty list of members", async done => {
      const jwtToken = await platform.auth.getJWTToken();
      const response = await platform.app.inject({
        method: "GET",
        url: `${url}/companies/${platform.workspace.company_id}/workspaces/${platform.workspace.workspace_id}/channels/${createdChannel.entity.id}/members`,
        headers: {
          authorization: `Bearer ${jwtToken}`,
        },
      });

      const result: ResourceListResponse<ChannelMember> = deserialize(
        ResourceListResponse,
        response.body,
      );

      expect(response.statusCode).toBe(200);
      expect(result.resources.length).toEqual(0);

      done();
    });

    it("should return list of members the user has access to", async done => {
      const member = getMember(createdChannel.entity, platform.currentUser);
      const memberCreationResult = await gr.services.channels.members.save(
        member,
        getContext(channel),
      );

      const jwtToken = await platform.auth.getJWTToken();
      const response = await platform.app.inject({
        method: "GET",
        url: `${url}/companies/${platform.workspace.company_id}/workspaces/${platform.workspace.workspace_id}/channels/${createdChannel.entity.id}/members`,
        headers: {
          authorization: `Bearer ${jwtToken}`,
        },
      });

      const result: ResourceListResponse<ChannelMember> = deserialize(
        ResourceListResponse,
        response.body,
      );

      expect(response.statusCode).toBe(200);
      expect(result.resources.length).toEqual(1);
      expect(result.resources[0]).toMatchObject({
        channel_id: memberCreationResult.entity.channel_id,
        workspace_id: memberCreationResult.entity.workspace_id,
        company_id: memberCreationResult.entity.company_id,
        user_id: memberCreationResult.entity.user_id,
      });

      done();
    });
  });

  describe("The POST / - Add member", () => {
    let channel;
    let createdChannel;

    beforeEach(async () => {
      channel = getChannel();
      createdChannel = await gr.services.channels.channels.save(channel, {}, getWorkspaceContext());
    });

    it("should fail when user_id is not defined", async done => {
      const jwtToken = await platform.auth.getJWTToken();
      const response = await platform.app.inject({
        method: "POST",
        url: `${url}/companies/${platform.workspace.company_id}/workspaces/${platform.workspace.workspace_id}/channels/${createdChannel.entity.id}/members`,
        headers: {
          authorization: `Bearer ${jwtToken}`,
        },
        payload: {
          resource: {},
        },
      });

      expect(response.statusCode).toEqual(400);

      done();
    });

    it("should be able to add current member", async done => {
      const jwtToken = await platform.auth.getJWTToken();
      const response = await platform.app.inject({
        method: "POST",
        url: `${url}/companies/${platform.workspace.company_id}/workspaces/${platform.workspace.workspace_id}/channels/${createdChannel.entity.id}/members`,
        headers: {
          authorization: `Bearer ${jwtToken}`,
        },
        payload: {
          resource: {
            user_id: platform.currentUser.id,
          },
        },
      });

      expect(response.statusCode).toEqual(201);

      done();
    });

    it("should be able to add another member", async done => {
      const jwtToken = await platform.auth.getJWTToken();
      const response = await platform.app.inject({
        method: "POST",
        url: `${url}/companies/${platform.workspace.company_id}/workspaces/${platform.workspace.workspace_id}/channels/${createdChannel.entity.id}/members`,
        headers: {
          authorization: `Bearer ${jwtToken}`,
        },
        payload: {
          resource: {
            user_id: uuidv1(),
          },
        },
      });

      expect(response.statusCode).toEqual(201);
      done();
    });
  });

  describe("The GET /:member_id - Get a member", () => {
    let channel;
    let createdChannel;

    beforeEach(async () => {
      channel = getChannel();
      createdChannel = await gr.services.channels.channels.save(channel, {}, getWorkspaceContext());
    });

    it("should 404 when member does not exist", async done => {
      const jwtToken = await platform.auth.getJWTToken();
      const response = await platform.app.inject({
        method: "GET",
        url: `${url}/companies/${platform.workspace.company_id}/workspaces/${
          platform.workspace.workspace_id
        }/channels/${createdChannel.entity.id}/members/${uuidv1()}`,
        headers: {
          authorization: `Bearer ${jwtToken}`,
        },
      });

      expect(response.statusCode).toEqual(404);
      done();
    });

    it("should send back member", async done => {
      const member = getMember(createdChannel.entity, platform.currentUser);
      const memberCreationResult = await gr.services.channels.members.save(
        member,
        getContext(channel),
      );
      const jwtToken = await platform.auth.getJWTToken();
      const response = await platform.app.inject({
        method: "GET",
        url: `${url}/companies/${platform.workspace.company_id}/workspaces/${platform.workspace.workspace_id}/channels/${createdChannel.entity.id}/members/${memberCreationResult.entity.user_id}`,
        headers: {
          authorization: `Bearer ${jwtToken}`,
        },
      });

      expect(response.statusCode).toEqual(200);
      const result: ResourceGetResponse<ChannelMember> = deserialize(
        ResourceGetResponse,
        response.body,
      );

      expect(response.statusCode).toBe(200);
      expect(result.resource).toMatchObject({
        channel_id: memberCreationResult.entity.channel_id,
        workspace_id: memberCreationResult.entity.workspace_id,
        company_id: memberCreationResult.entity.company_id,
        user_id: memberCreationResult.entity.user_id,
      });

      done();
    });
  });

  describe("The POST /:member_id - Update a member", () => {
    let channel;
    let createdChannel;

    beforeEach(async () => {
      channel = getChannel();
      createdChannel = await gr.services.channels.channels.save(channel, {}, getWorkspaceContext());
    });

    it("should not be able to update a member when current user is not the member", async done => {
      const member = getMember(createdChannel.entity, { id: uuidv4() });
      const memberCreationResult = await gr.services.channels.members.save(
        member,
        getContext(channel),
      );
      const jwtToken = await platform.auth.getJWTToken();
      const response = await platform.app.inject({
        method: "POST",
        url: `${url}/companies/${platform.workspace.company_id}/workspaces/${platform.workspace.workspace_id}/channels/${createdChannel.entity.id}/members/${memberCreationResult.entity.user_id}`,
        headers: {
          authorization: `Bearer ${jwtToken}`,
        },
        payload: {
          resource: {
            favorite: true,
          },
        },
      });

      expect(response.statusCode).toEqual(400);
      done();
    });

    it("should be able to update member when current user is the member", async done => {
      const member = getMember(createdChannel.entity, platform.currentUser);
      const memberCreationResult = await gr.services.channels.members.save(
        member,
        getContext(channel),
      );
      const jwtToken = await platform.auth.getJWTToken();
      const response = await platform.app.inject({
        method: "POST",
        url: `${url}/companies/${platform.workspace.company_id}/workspaces/${platform.workspace.workspace_id}/channels/${createdChannel.entity.id}/members/${memberCreationResult.entity.user_id}`,
        headers: {
          authorization: `Bearer ${jwtToken}`,
        },
        payload: {
          resource: {
            favorite: true,
          },
        },
      });

      expect(response.statusCode).toEqual(200);

      const channelMember: ChannelMember = await gr.services.channels.members.get(member);

      expect(channelMember).toMatchObject({
        channel_id: memberCreationResult.entity.channel_id,
        workspace_id: memberCreationResult.entity.workspace_id,
        company_id: memberCreationResult.entity.company_id,
        user_id: memberCreationResult.entity.user_id,
        favorite: true,
      });

      done();
    });
  });

  describe("The DELETE /:member_id - Remove a member", () => {
    let channel;
    let createdChannel;

    beforeEach(async () => {
      channel = getChannel();
      createdChannel = await gr.services.channels.channels.save(channel, {}, getWorkspaceContext());
    });

    it("should 404 when member does not exist", async done => {
      const jwtToken = await platform.auth.getJWTToken();
      const response = await platform.app.inject({
        method: "DELETE",
        url: `${url}/companies/${platform.workspace.company_id}/workspaces/${
          platform.workspace.workspace_id
        }/channels/${createdChannel.entity.id}/members/${uuidv1()}`,
        headers: {
          authorization: `Bearer ${jwtToken}`,
        },
        payload: {
          resource: {
            favorite: true,
          },
        },
      });

      expect(response.statusCode).toEqual(404);
      done();
    });

    it("should not be able to remove the member when current user does not have enough rights", async done => {
      // const member = getMember(createdChannel.entity, { id: uuidv4() });
      // const memberCreationResult = await gr.services.channels.members.save(member);
      // const jwtToken = await platform.auth.getJWTToken();
      // const response = await platform.app.inject({
      //   method: "DELETE",
      //   url: `${url}/companies/${platform.workspace.company_id}/workspaces/${platform.workspace.workspace_id}/channels/${createdChannel.entity.id}/members/${memberCreationResult.entity.user_id}`,
      //   headers: {
      //     authorization: `Bearer ${jwtToken}`,
      //   },
      // });
      //
      // expect(response.statusCode).toEqual(400);
      // done();
    });

    it("should be able to remove the member when current user is the member", async done => {
      const member = getMember(createdChannel.entity, platform.currentUser);
      const memberCreationResult = await gr.services.channels.members.save(
        member,
        getContext(channel),
      );
      const jwtToken = await platform.auth.getJWTToken();
      const response = await platform.app.inject({
        method: "DELETE",
        url: `${url}/companies/${platform.workspace.company_id}/workspaces/${platform.workspace.workspace_id}/channels/${createdChannel.entity.id}/members/${memberCreationResult.entity.user_id}`,
        headers: {
          authorization: `Bearer ${jwtToken}`,
        },
      });

      expect(response.statusCode).toEqual(204);
      done();
    });
  });
});

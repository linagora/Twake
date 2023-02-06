import "reflect-metadata";
import { afterEach, beforeEach, describe, expect, it } from "@jest/globals";
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
import io from "socket.io-client";
import { Channel, ChannelMember } from "../../../src/services/channels/entities";
import { init, TestPlatform } from "../setup";
import { ChannelUtils, get as getChannelUtils } from "./utils";
import { getPublicRoomName } from "../../../src/services/channels/services/member/realtime";
import { SaveResult } from "../../../src/core/platform/framework/api/crud-service";
import gr from "../../../src/services/global-resolver";

describe.skip("The Channels Members Realtime feature", () => {
  const url = "/internal/services/channels/v1";
  let platform: TestPlatform;
  let socket: SocketIOClient.Socket;
  let channelUtils: ChannelUtils;

  beforeEach(async () => {
    platform = await init({
      services: [
        "message-queue",
        "user",
        "search",
        "websocket",
        "webserver",
        "channels",
        "auth",
        "database",
        "search",
        "realtime",
      ],
    });
    channelUtils = getChannelUtils(platform);
  });

  afterEach(async () => {
    await platform.tearDown();
    platform = null;
    socket && socket.close();
    socket = null;
  });

  function connect() {
    socket = io.connect("http://localhost:3000", { path: "/socket.io" });
    socket.connect();
  }

  describe("On channel member creation", () => {
    let channel;
    let createdChannel: SaveResult<Channel>;

    beforeEach(async () => {
      channel = channelUtils.getChannel();
      createdChannel = await gr.services.channels.channels.save(
        channel,
        {},
        channelUtils.getContext({ id: channel.owner }),
      );
    });

    it("should notify the client", async () => {
      const jwtToken = await platform.auth.getJWTToken();
      const roomToken = "twake";

      connect();
      socket.on("connect", () => {
        socket
          .emit("authenticate", { token: jwtToken })
          .on("authenticated", () => {
            socket.emit("realtime:join", {
              name: getPublicRoomName(createdChannel.entity),
              token: roomToken,
            });
            socket.on("realtime:join:error", () => done(new Error("Should not occur")));
            socket.on("realtime:join:success", async () => {
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
            });
            socket.on("realtime:resource", event => {
              expect(event.type).toEqual("channel_member");
              expect(event.action).toEqual("saved");
              expect(event.resource).toMatchObject({
                company_id: platform.workspace.company_id,
                workspace_id: platform.workspace.workspace_id,
                user_id: platform.currentUser.id,
                channel_id: createdChannel.entity.id,
              });
            });
          })
          .on("unauthorized", () => {
            done(new Error("Should not occur"));
          });
      });
    });
  });

  describe("On channel member removal", () => {
    it("should notify the client", async () => {
      const jwtToken = await platform.auth.getJWTToken();
      const roomToken = "twake";

      const channel = channelUtils.getChannel(platform.currentUser.id);

      const creationResult = await gr.services.channels.channels.save(
        channel,
        {},
        channelUtils.getContext({ id: channel.owner }),
      );
      const member = {
        channel_id: creationResult.entity.id,
        workspace_id: platform.workspace.workspace_id,
        company_id: platform.workspace.company_id,
        user_id: platform.currentUser.id,
      } as ChannelMember;

      await gr.services.channels.members.save(member, {
        channel: creationResult.entity,
        user: platform.currentUser,
      });

      connect();
      socket.on("connect", () => {
        socket
          .emit("authenticate", { token: jwtToken })
          .on("authenticated", () => {
            socket.on("realtime:resource", event => {
              if (event.action !== "deleted") {
                // we can receive event when resource is created...
                return;
              }

              expect(event.type).toEqual("channel_member");
              expect(event.action).toEqual("deleted");
              expect(event.resource).toMatchObject({
                company_id: platform.workspace.company_id,
                workspace_id: platform.workspace.workspace_id,
                user_id: platform.currentUser.id,
                channel_id: creationResult.entity.id,
              });
            });
            socket.emit("realtime:join", {
              name: getPublicRoomName(creationResult.entity),
              token: roomToken,
            });
            socket.on("realtime:join:error", () => done(new Error("Should not occur")));
            socket.on("realtime:join:success", async () => {
              const response = await platform.app.inject({
                method: "DELETE",
                url: `${url}/companies/${creationResult.entity.company_id}/workspaces/${creationResult.entity.workspace_id}/channels/${creationResult.entity.id}/members/${platform.currentUser.id}`,
                headers: {
                  authorization: `Bearer ${jwtToken}`,
                },
              });
            });
          })
          .on("unauthorized", () => {
            done(new Error("Should not occur"));
          });
      });
    });
  });
});

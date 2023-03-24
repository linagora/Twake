import "reflect-metadata";
import { afterEach, beforeEach, describe, expect, it } from "@jest/globals";
import { ObjectId } from "mongodb";
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
import io from "socket.io-client";
import { Channel } from "../../../src/services/channels/entities/channel";
import {
  getChannelPath,
  getPublicRoomName,
} from "../../../src/services/channels/services/channel/realtime";
import { WorkspaceExecutionContext } from "../../../src/services/channels/types";
import { init, TestPlatform } from "../setup";
import { ChannelUtils, get as getChannelUtils } from "./utils";
import gr from "../../../src/services/global-resolver";

describe("The Channels Realtime feature", () => {
  const url = "/internal/services/channels/v1";
  let platform: TestPlatform;
  let socket: SocketIOClient.Socket;
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
        "search",
        "websocket",
        "applications",
        "webserver",
        "channels",
        "auth",
        "search",
        "realtime",
        "counter",
        "statistics",
        "platform-services",
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
    socket = io.connect("http://localhost:3000", { path: "/socket" });
    socket.connect();
  }

  describe("On channel creation", () => {
    it("should notify the client", async done => {
      const jwtToken = await platform.auth.getJWTToken();
      const roomToken = "twake";
      const channelName = new ObjectId().toString();

      connect();
      socket.on("connect", () => {
        socket
          .emit("authenticate", { token: jwtToken })
          .on("authenticated", () => {
            socket.emit("realtime:join", {
              name: getPublicRoomName(platform.workspace),
              token: roomToken,
            });
            socket.on("realtime:join:error", () => done(new Error("Should not occur")));
            socket.on("realtime:join:success", async () => {
              const response = await platform.app.inject({
                method: "POST",
                url: `${url}/companies/${platform.workspace.company_id}/workspaces/${platform.workspace.workspace_id}/channels`,
                headers: {
                  authorization: `Bearer ${jwtToken}`,
                },
                payload: {
                  resource: {
                    name: channelName,
                  },
                },
              });

              expect(response.statusCode).toEqual(201);
            });
            socket.on(
              "realtime:resource",
              (event: { type: any; action: any; resource: { name: any } }) => {
                // we can also receive other types of events (channel_activity etc)
                if (event.type === "channel") {
                  expect(event.type).toEqual("channel");
                  expect(event.action).toEqual("saved");
                  expect(event.resource.name).toEqual(channelName);
                  done();
                }
              },
            );
          })
          .on("unauthorized", () => {
            done(new Error("Should not occur"));
          });
      });
    });
  });

  describe("On channel removal", () => {
    it("should notify the client", async done => {
      const jwtToken = await platform.auth.getJWTToken();
      const roomToken = "twake";
      const channelName = new ObjectId().toString();

      const channel = channelUtils.getChannel(platform.currentUser.id);
      channel.name = channelName;

      const creationResult = await gr.services.channels.channels.save(
        channel,
        {},
        channelUtils.getContext({ id: channel.owner }),
      );

      connect();
      socket.on("connect", () => {
        socket
          .emit("authenticate", { token: jwtToken })
          .on("authenticated", () => {
            socket.on(
              "realtime:resource",
              (event: { action: string; type: any; path: any; resource: { id: any } }) => {
                if (event.action !== "deleted" || event.type !== "channel") {
                  // we can receive event when resource is created...
                  // we can also receive other types of events (channel_activity etc)
                  return;
                }

                expect(event.type).toEqual("channel");
                expect(event.action).toEqual("deleted");
                expect(event.path).toEqual(
                  getChannelPath(
                    { id: creationResult.entity.id } as Channel,
                    {
                      workspace: platform.workspace,
                    } as WorkspaceExecutionContext,
                  ),
                );
                expect(event.resource.id).toEqual(creationResult.entity.id);
                done();
              },
            );
            socket.emit("realtime:join", {
              name: getPublicRoomName(platform.workspace),
              token: roomToken,
            });
            socket.on("realtime:join:error", () => done(new Error("Should not occur")));
            socket.on("realtime:join:success", async () => {
              await platform.app.inject({
                method: "DELETE",
                url: `${url}/companies/${creationResult.entity.company_id}/workspaces/${creationResult.entity.workspace_id}/channels/${creationResult.entity.id}`,
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

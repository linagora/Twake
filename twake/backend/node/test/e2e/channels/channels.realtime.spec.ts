import { describe, expect, it, beforeEach, afterEach } from "@jest/globals";
import { ObjectId } from "mongodb";
import io from "socket.io-client";
import { Channel } from "../../../src/services/channels/entities";
import ChannelServiceAPI from "../../../src/services/channels/provider";
import { getChannelPath, getPublicRoomName } from "../../../src/services/channels/realtime";
import { WorkspaceExecutionContext } from "../../../src/services/channels/types";
import { TestPlatform, init } from "../setup";

describe("The Channels Realtime feature", () => {
  const url = "/api/channels";
  let platform: TestPlatform;
  let socket: SocketIOClient.Socket;

  beforeEach(async () => {
    platform = await init({
      services: ["websocket", "webserver", "channels", "auth", "database", "realtime"],
    });
    socket = io.connect("http://localhost:3000", { path: "/socket.io" });
  });

  afterEach(async () => {
    await platform.tearDown();
    platform = null;
    socket && socket.close();
    socket = null;
  });

  describe("On channel creation", () => {
    it("should notify the client", async done => {
      const companyId = "0";
      const workspaceId = "0";
      const jwtToken = await platform.auth.getJWTToken();
      const roomToken = "twake";
      const channelName = new ObjectId().toString();

      socket.connect();
      socket.on("connect", () => {
        socket
          .emit("authenticate", { token: jwtToken })
          .on("authenticated", () => {
            socket.emit("realtime:join", {
              name: getPublicRoomName({ workspace_id: workspaceId, company_id: companyId }),
              token: roomToken,
            });
            socket.on("realtime:join:error", () => done(new Error("Should not occur")));
            socket.on("realtime:join:success", async () => {
              const response = await platform.app.inject({
                method: "POST",
                url: `${url}/companies/${companyId}/workspaces/${workspaceId}/channels`,
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
            socket.on("realtime:resource", event => {
              expect(event.type).toEqual("channel");
              expect(event.action).toEqual("created");
              expect(event.resource.name).toEqual(channelName);
              done();
            });
          })
          .on("unauthorized", () => {
            done(new Error("Should not occur"));
          });
      });
    });
  });

  describe("On channel removal", () => {
    it("should notify the client", async done => {
      const companyId = "0";
      const workspaceId = "0";
      const jwtToken = await platform.auth.getJWTToken();
      const roomToken = "twake";
      const channelName = new ObjectId().toString();

      const channelService = platform.platform.getProvider<ChannelServiceAPI>("channels");
      const channel = new Channel();
      channel.name = channelName;
      channel.company_id = companyId;
      channel.workspace_id = workspaceId;

      const creationResult = await channelService.create(channel);

      socket.connect();
      socket.on("connect", () => {
        socket
          .emit("authenticate", { token: jwtToken })
          .on("authenticated", () => {
            socket.on("realtime:resource", event => {
              if (event.action !== "deleted") {
                // we can receive event when resource is created...
                return;
              }

              expect(event.type).toEqual("channel");
              expect(event.action).toEqual("deleted");
              expect(event.path).toEqual(
                getChannelPath(
                  { id: creationResult.entity.id } as Channel,
                  {
                    workspace: { workspace_id: workspaceId, company_id: companyId },
                  } as WorkspaceExecutionContext,
                ),
              );
              expect(event.resource.id).toEqual(creationResult.entity.id);
              done();
            });
            socket.emit("realtime:join", {
              name: getPublicRoomName({ workspace_id: workspaceId, company_id: companyId }),
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

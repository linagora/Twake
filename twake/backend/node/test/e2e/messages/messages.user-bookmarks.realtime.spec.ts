import "reflect-metadata";
import { describe, expect, it, beforeEach, afterEach } from "@jest/globals";
import io from "socket.io-client";
import { TestPlatform, init } from "../setup";
import { MessageServiceAPI } from "../../../src/services/messages/api";

describe("The Bookmarks Realtime feature", () => {
  const url = "/internal/services/messages/v1";
  let platform: TestPlatform;
  let socket: SocketIOClient.Socket;

  beforeEach(async () => {
    platform = await init({
      services: [
        "pubsub",
        "user",
        "websocket",
        "webserver",
        "messages",
        "auth",
        "database",
        "realtime",
      ],
    });
  });

  afterEach(async () => {
    await platform.tearDown();
    platform = null;
  });

  function connect() {
    socket = io.connect("http://localhost:3000", { path: "/socket" });
    socket.connect();
  }

  describe("On bookmark creation", () => {
    it("should notify the client", async done => {
      const service = platform.platform.getProvider<MessageServiceAPI>("messages");

      const jwtToken = await platform.auth.getJWTToken();
      const roomToken = "twake";

      connect();
      socket.on("connect", () => {
        socket
          .emit("authenticate", { token: jwtToken })
          .on("authenticated", () => {
            socket.emit("realtime:join", {
              name: "TODO",
              token: roomToken,
            });
            socket.on("realtime:join:error", () => done(new Error("Should not occur")));
            socket.on("realtime:join:success", async () => {
              await service.userBookmarks.save({
                company_id: platform.workspace.company_id,
                user_id: platform.currentUser.id,
                name: "mybookmark",
              });
            });
            socket.on("realtime:resource", event => {
              expect(event.type).toEqual("user_message_bookmark");
              //expect(event.action).toEqual("saved");
              //expect(event.resource.name).toEqual(channelName);
              done();
            });
          })
          .on("unauthorized", () => {
            done(new Error("Should not occur"));
          });
      });
    });
  });

  describe("On bookmark removal", () => {
    it("should notify the client", async done => {
      const service = platform.platform.getProvider<MessageServiceAPI>("messages");

      await service.userBookmarks.save({
        company_id: platform.workspace.company_id,
        user_id: platform.currentUser.id,
        name: "mybookmark",
      });

      const jwtToken = await platform.auth.getJWTToken();
      const roomToken = "twake";

      connect();
      socket.on("connect", () => {
        socket
          .emit("authenticate", { token: jwtToken })
          .on("authenticated", () => {
            socket.emit("realtime:join", {
              name: "TODO",
              token: roomToken,
            });
            socket.on("realtime:join:error", () => done(new Error("Should not occur")));
            socket.on("realtime:join:success", async () => {
              await service.userBookmarks.delete({
                company_id: platform.workspace.company_id,
                user_id: platform.currentUser.id,
                name: "mybookmark",
              });
            });
            socket.on("realtime:resource", event => {
              expect(event.type).toEqual("user_message_bookmark");
              //expect(event.action).toEqual("saved");
              //expect(event.resource.name).toEqual(channelName);
              done();
            });
          })
          .on("unauthorized", () => {
            done(new Error("Should not occur"));
          });
      });
    });
  });
});

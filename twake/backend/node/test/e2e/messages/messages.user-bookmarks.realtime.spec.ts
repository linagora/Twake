import "reflect-metadata";
import { describe, expect, it, beforeEach, afterEach, afterAll } from "@jest/globals";
import io from "socket.io-client";
import { TestPlatform, init } from "../setup";
import { MessageServiceAPI } from "../../../src/services/messages/api";
import { TwakePlatform } from "../../../src/core/platform/platform";

describe("The Bookmarks Realtime feature", () => {
  const url = "/internal/services/messages/v1";
  let platform: TestPlatform;
  let socket: SocketIOClient.Socket;

  beforeEach(async () => {
    platform = await init({
      services: [
        "webserver",
        "database",
        "search",
        "storage",
        "pubsub",
        "files",
        "user",
        "websocket",
        "webserver",
        "messages",
        "applications",
        "auth",
        "search",
        "realtime",
        "channels",
        "counter",
        "platform-services",
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

  afterAll(async done => {
    socket && socket.close();
    socket = null;
  });

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
            socket.on("realtime:join:error", () => done(new Error("Should not occur")));
            socket.on("realtime:join:success", async () => {
              await service.userBookmarks.save(
                {
                  company_id: platform.workspace.company_id,
                  user_id: platform.currentUser.id,
                  name: "mybookmarksaved",
                  id: undefined,
                },
                {},
                getContext(platform),
              );
            });
            socket.on("realtime:resource", (event: any) => {
              expect(event.type).toEqual("user_message_bookmark");
              expect(event.action).toEqual("saved");
              expect(event.resource.name).toEqual("mybookmarksaved");
              done();
            });
            socket.emit("realtime:join", {
              name: `/companies/${platform.workspace.company_id}/messages/bookmarks`,
              token: roomToken,
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

      const instance = await service.userBookmarks.save(
        {
          company_id: platform.workspace.company_id,
          user_id: platform.currentUser.id,
          name: "mybookmark",
          id: undefined,
        },
        {},
        getContext(platform),
      );

      const jwtToken = await platform.auth.getJWTToken();
      const roomToken = "twake";

      connect();
      socket.on("connect", () => {
        socket
          .emit("authenticate", { token: jwtToken })
          .on("authenticated", () => {
            socket.on("realtime:join:error", () => done(new Error("Should not occur")));
            socket.on("realtime:join:success", async () => {
              await service.userBookmarks.delete(
                {
                  company_id: platform.workspace.company_id,
                  user_id: platform.currentUser.id,
                  id: instance.entity.id,
                },
                getContext(platform),
              );
            });
            socket.on("realtime:resource", (event: any) => {
              expect(event.type).toEqual("user_message_bookmark");
              expect(event.action).toEqual("deleted");
              done();
            });
            socket.emit("realtime:join", {
              name: `/companies/${platform.workspace.company_id}/messages/bookmarks`,
              token: roomToken,
            });
          })
          .on("unauthorized", () => {
            done(new Error("Should not occur"));
          });
      });
    });
  });
});

function getContext(platform: TestPlatform) {
  return {
    company: { id: platform.workspace.company_id },
    user: { id: platform.currentUser.id },
  };
}

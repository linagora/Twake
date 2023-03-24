import "reflect-metadata";
import { afterEach, beforeEach, describe, expect, it } from "@jest/globals";
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
import io from "socket.io-client";
import { init, TestPlatform } from "../setup";
import gr from "../../../src/services/global-resolver";

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
        "message-queue",
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
        "statistics",
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

  describe("On bookmark creation", () => {
    it("should notify the client", async done => {
      const jwtToken = await platform.auth.getJWTToken();
      const roomToken = "twake";

      connect();
      socket.on("connect", () => {
        socket
          .emit("authenticate", { token: jwtToken })
          .on("authenticated", () => {
            socket.on("realtime:join:error", () => done(new Error("Should not occur")));
            socket.on("realtime:join:success", async () => {
              await gr.services.messages.userBookmarks.save(
                {
                  company_id: platform.workspace.company_id,
                  user_id: platform.currentUser.id,
                  name: "mybookmarksaved",
                  id: undefined,
                },
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
      const instance = await gr.services.messages.userBookmarks.save(
        {
          company_id: platform.workspace.company_id,
          user_id: platform.currentUser.id,
          name: "mybookmark",
          id: undefined,
        },
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
              await gr.services.messages.userBookmarks.delete(
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

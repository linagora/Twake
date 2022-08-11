import { afterEach, beforeEach, describe, it } from "@jest/globals";
import { init, TestPlatform } from "../setup";
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
import io from "socket.io-client";

describe("The Websocket authentication", () => {
  let platform: TestPlatform;
  let socket: SocketIOClient.Socket;

  beforeEach(async ends => {
    platform = await init({
      services: [
        "webserver",
        "database",
        "search",
        "storage",
        "message-queue",
        "user",
        "websocket",
        "webserver",
        "applications",
        "auth",
        "realtime",
        "channels" /* FIXME: platform is not started if a business service is not in dependencies */,
        "counter",
        "statistics",
        "platform-services",
      ],
    });

    socket = io.connect("http://localhost:3000", { path: "/socket" });

    ends();
  });

  afterEach(async ends => {
    platform && (await platform.tearDown());
    platform = null;
    socket && socket.close();
    socket = null;
    ends();
  });

  describe("JWT-based Authentication", () => {
    it("should not be able to connect without a JWT token", done => {
      socket.connect();
      socket.on("connect", () => {
        socket
          .emit("authenticate", {})
          .on("authenticated", () => {
            done(new Error("Should not occur"));
          })
          .on("unauthorized", (msg: any) => {
            done();
          });
      });
    });

    it("should not be able to connect with something which is not a JWT token", done => {
      socket.connect();
      socket.on("connect", () => {
        socket
          .emit("authenticate", { token: "Not a JWT token" })
          .on("authenticated", () => {
            done(new Error("Should not occur"));
          })
          .on("unauthorized", (msg: any) => {
            done();
          });
      });
    });

    it("should be able to connect with a JWT token", async done => {
      const token = await platform.auth.getJWTToken();

      socket.connect();
      socket.on("connect", () => {
        socket
          .emit("authenticate", { token })
          .on("authenticated", () => {
            done();
          })
          .on("unauthorized", () => {
            done(new Error("Should not occur"));
          });
      });
    });
  });
});

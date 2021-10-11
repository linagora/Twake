import { describe, it, beforeEach, afterEach } from "@jest/globals";
import { TestPlatform, init } from "../setup";
import io from "socket.io-client";
import { UnauthorizedError } from "socketio-jwt";

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
        "pubsub",
        "user",
        "websocket",
        "webserver",
        "applications",
        "auth",
        "realtime",
        "channels" /* FIXME: platform is not started if a business service is not in dependencies */,
        "counter",
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
          .on("unauthorized", (msg: UnauthorizedError) => {
            console.log(`unauthorized: ${JSON.stringify(msg.data)}`);
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
          .on("unauthorized", (msg: UnauthorizedError) => {
            console.log(`unauthorized: ${JSON.stringify(msg.data)}`);
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

/* eslint-disable @typescript-eslint/no-var-requires */
const io = require("socket.io-client");

const token = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJfaWQiOjEsImlhdCI6MTYwMzE5ODkzMn0.NvQoV9KeWuTNzRvzqbJ5uZCQ8Nmi2rCYQzcKk-WsJJ8";
const socket = io.connect("http://localhost:3000", { path: "/ws" });

socket.on("connect", () => {
  socket
    .emit("authenticate", { token })
    .on("authenticated", () => {
      console.log("Authenticated in WS");
      // this one fails
      socket.emit("realtime:join", { name: "/channels" });
      // this one should be OK
      socket.emit("realtime:join", { name: "/channels", token: "twake" });
      socket.on("realtime:join:error", (message) => {
        // will fire when join does not provide a valid token
        console.log("Error on realtime", message);
      });

      socket.on("resource:created", event => {
        console.log("New resource has been created", event);
      });

    })
    .on("unauthorized", err => {
      console.log("Unauthorize", err);
    });
});

socket.on("disconnected", () => console.log("Disconnected"));


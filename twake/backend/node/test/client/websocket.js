/* eslint-disable @typescript-eslint/no-var-requires */
const io = require("socket.io-client");

const token =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6MSwiaWF0IjoxNjAzODk3MDI3fQ.SLgSEQtsKSgh3k4YEQPmQCVER-_sMkeqrqepMgLT3BE";
const socket = io.connect("http://localhost:3000", { path: "/socket" });

socket.on("connect", () => {
  socket
    .emit("authenticate", { token })
    .on("authenticated", () => {
      console.log("Authenticated in WS");
      // this one fails
      socket.emit("realtime:join", { name: "/channels" });
      // this one should be OK
      socket.emit("realtime:join", { name: "/channels", token });
      socket.on("realtime:join:error", message => {
        // will fire when join does not provide a valid token
        console.log("Error on realtime", message);
      });

      socket.on("realtime:join:success", event => {
        console.log("Joined room", event.name);
      });

      socket.on("realtime:resource", event => {
        console.log(`Resource has been ${event.action}`, event);
      });
    })
    .on("unauthorized", err => {
      console.log("Unauthorize", err);
    });
});

socket.on("disconnected", () => console.log("Disconnected"));

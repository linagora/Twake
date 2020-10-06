import socketIO from "socket.io";

export default interface WebSocketAPI {
  getIo(): socketIO.Server;
}

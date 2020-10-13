import socketIO from "socket.io";
import { TwakeServiceProvider } from "../../core/platform/framework";

export default interface WebSocketAPI extends TwakeServiceProvider {
  getIo(): socketIO.Server;
}

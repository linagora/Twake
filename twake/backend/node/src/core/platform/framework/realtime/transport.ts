import WebSocketAPI from "../../../../services/websocket/provider";

export default class RealtimeTransport {
  constructor(private ws: WebSocketAPI) {}
}
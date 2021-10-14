import { TransportAPI, TransportOptions, WebSocketTransport } from './TransportAPI';
import TransportHTTP from './TransportHTTP';
import TransportSocket from './TransportSocket';

export default class Transport implements TransportAPI {
  public apiOptions: any = {
    headers: {
      'Content-Type': 'application/json',
    },
  };
  private http: TransportHTTP;
  private socket: TransportSocket;

  constructor() {
    this.http = new TransportHTTP(this);
    this.socket = new TransportSocket();
  }

  public connect(options: TransportOptions) {
    this.socket.configure(options.socket);
    this.http.configure(options?.rest);
  }

  public getHttp() {
    return this.http;
  }

  public getSocket(): WebSocketTransport {
    return this.socket;
  }
}

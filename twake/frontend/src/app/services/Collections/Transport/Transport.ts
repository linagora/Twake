import Collections, { Collection, Resource } from '../Collections';
import TransportHTTP from './TransportHTTP';
import TransportSocket from './TransportSocket';

export default class Transport {
  public apiOptions: any = {
    headers: {
      'Content-Type': 'application/json',
    },
  };
  private readonly http: TransportHTTP = new TransportHTTP(this);
  private readonly socket: TransportSocket = new TransportSocket(this);

  constructor() {}

  /** Transport API */

  public connect() {
    this.socket.connect();
  }

  public getHttp() {
    return this.http;
  }

  public getSocket() {
    return this.socket;
  }
}

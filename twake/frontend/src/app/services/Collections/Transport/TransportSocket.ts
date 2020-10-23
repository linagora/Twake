import Collections, { Collection, Resource } from '../Collections';
import Transport from './Transport';
import io from 'socket.io-client';

export default class TransportSocket {
  private socket: SocketIOClient.Socket | null = null;
  constructor(private readonly transport: Transport) {}

  connect() {
    this.socket = io.connect(Collections.getOptions().transport?.socket?.url || '', {
      reconnectionDelayMax: 10000,
    });
    const socket = this.socket;
    this.socket.on('connect', () => {
      socket
        .emit('authenticate', Collections.getOptions().transport?.socket?.authenticate || {})
        .on('authenticated', () => {
          console.log('authenticated');
        })
        .on('unauthorized', (err: any) => {
          console.log('Unauthorize', err);
        });
    });
  }

  join(path: string) {
    if (this.socket) {
      this.socket.emit('realtime:join', { name: path, token: 'twake' });
    }
  }
}

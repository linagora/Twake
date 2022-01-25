import { WebsocketEvents } from 'app/features/websocket/types/websocket';
import { merge } from 'lodash';
import Collections, { Resource } from '../Collections';
import CollectionTransport from './CollectionTransport';

type WebsocketResourceEvent = {
  action:
    | 'created'
    | 'updated'
    | 'saved'
    | 'deleted'
    | 'realtime:join:success'
    | 'realtime:join:error';
  resource: any;
  type: string;
};
type WebsocketJoinEvent = {
  name: string;
};
type WebsocketDefinition = {
  room: string;
  token: string;
};

export default class CollectionTransportSocket<G extends Resource<any>> {
  private websocketBuffer: WebsocketResourceEvent[] = [];
  private websocketRooms: WebsocketDefinition[] = [];
  private joined: string[] = [];
  private lastConnectedTime = 0;

  constructor(private readonly transport: CollectionTransport<G>) {}

  /**
   * This collection is visible, transport must start
   */
  start() {
    this.websocketRooms.forEach(definition => {
      if (this.joined.indexOf(definition.room) < 0) {
        Collections.getTransport()
          .getSocket()
          .join(
            definition.room,
            definition.token,
            this.transport.collection.getPath(),
            async (
              type: WebsocketEvents | string,
              event: WebsocketResourceEvent & WebsocketJoinEvent,
            ) => {
              switch (type) {
                case WebsocketEvents.Disconnected:
                  this.lastConnectedTime = new Date().getTime();
                  break;
                case WebsocketEvents.Connected:
                  this.joined = [];
                  this.start();
                  if (new Date().getTime() - this.lastConnectedTime > 1000) {
                    this.transport.collection.reload();
                  }
                  break;
                case WebsocketEvents.JoinSuccess:
                  this.joined.push(event.name);
                  break;
                case WebsocketEvents.JoinError:
                  this.joined.splice(this.joined.indexOf(event.name), 1);
                  console.log('Disconnected from ', event.name);
                  break;
                case WebsocketEvents.Resource:
                  this.websocketBuffer.push(event as WebsocketResourceEvent);
                  if (this.transport.httpUsed === 0) this.flushWebsocketBuffer();
                  break;
                default:
                  console.warn('Not implemented: ', type, event);
              }
            },
          );
      }
    });
  }

  /**
   * This collection is not visible / used anymore, transport can stop
   */
  stop() {
    this.joined.forEach(room => {
      Collections.getTransport().getSocket().leave(room, this.transport.collection.getTag());
    });
  }

  flushWebsocketBuffer() {
    const buffer = this.websocketBuffer;
    this.websocketBuffer = [];
    buffer.forEach(event => {
      this.onWebsocketResourceEvent(event.action, event.type, event.resource);
    });
  }

  async updateWebsocketInformation(websockets: WebsocketDefinition[]) {
    this.websocketRooms = websockets;
    this.start();
  }

  async onWebsocketResourceEvent(action: string, type: string, resource: any) {
    if (action === 'event') {
      this.transport.collection.getEventEmitter().emit(type, resource);
    }
    if (action === 'created' || action === 'updated' || action === 'saved') {
      let localResource = this.transport.collection.findOne(
        resource[new (this.transport.collection.getType())({}).getIdKey()],
        { withoutBackend: true },
      );
      if (!localResource) {
        localResource = new (this.transport.collection.getType())(resource);
      }
      localResource.data = merge(localResource.data, resource);
      localResource.setShared();
      this.transport.collection.upsert(localResource, {
        withoutBackend: true,
      });
    }
    if (action === 'deleted') {
      let localResource = this.transport.collection.findOne(
        resource[new (this.transport.collection.getType())({}).getIdKey()],
        { withoutBackend: true },
      );
      this.transport.collection.remove(localResource, {
        withoutBackend: true,
        alwaysNotify: true, //Because the localDB can already have deleted the item from an other tab
      });
    }
  }
}

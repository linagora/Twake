import _ from 'lodash';
import Collections, { Resource } from '../Collections';
import CollectionTransport from './CollectionTransport';
import { WebsocketEvents } from './TransportSocket';

type WebsocketResourceEvent = {
  action:
    | 'created'
    | 'updated'
    | 'saved'
    | 'deleted'
    | 'realtime:join:success'
    | 'realtime:join:error';
  resource: any;
};
type WebsocketJoinEvent = {
  name: string;
};
type WebsocketDefinition = {
  room: string;
};

export default class CollectionTransportSocket<G extends Resource<any>> {
  private websocketBuffer: WebsocketResourceEvent[] = [];
  private websocketRooms: WebsocketDefinition[] = [];
  private joined: string[] = [];

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
            this.transport.collection.getTag(),
            async (type: WebsocketEvents, event: WebsocketResourceEvent & WebsocketJoinEvent) => {
              switch (type) {
                case WebsocketEvents.Connected:
                  this.joined = [];
                  this.start();
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
      this.onWebsocketResourceEvent(event.action, event.resource);
    });
  }

  async updateWebsocketInformation(websockets: WebsocketDefinition[]) {
    this.websocketRooms = websockets;
    this.start();
  }

  async onWebsocketResourceEvent(action: string, resource: any) {
    if (action === 'created' || action === 'updated' || action === 'saved') {
      let localResource = await this.transport.collection.findOne(resource.id);
      if (!localResource) {
        localResource = new (this.transport.collection.getType())(resource);
      }
      localResource.data = _.merge(localResource.data, resource);
      localResource.setShared();
      this.transport.collection.upsert(localResource, {
        withoutBackend: true,
      });
    }
    if (action === 'deleted') {
      let localResource = await this.transport.collection.findOne({ id: resource.id });
      this.transport.collection.remove(localResource, {
        withoutBackend: true,
        alwaysNotify: true, //Because the localDB can already have deleted the item from an other tab
      });
    }
  }
}

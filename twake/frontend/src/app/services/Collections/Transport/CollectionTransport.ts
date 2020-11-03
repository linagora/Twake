import Collections, { Collection, Resource } from '../Collections';
import CollectionTransportSockets from './CollectionTransportSockets';

type WebsocketEvent = { action: 'created' | 'updated' | 'deleted'; resource: any };
type ServerAction = {
  action: 'create' | 'update' | 'delete';
  resourceId: string;
  options: any;
};
type WebsocketDefinition = {
  room: string;
};

export default class CollectionTransport<G extends Resource<any>> {
  private socketTransport: CollectionTransportSockets<G> = new CollectionTransportSockets<G>(this);
  private buffer: ServerAction[] = [];
  httpUsed: number = 0;

  constructor(readonly collection: Collection<G>) {
    //@ts-ignore
    window.CollectionTransport = this;
  }

  /**
   * This collection is visible, transport must start
   */
  start() {
    this.socketTransport.start();
  }

  /**
   * This collection is not visible / used anymore, transport can stop
   */
  stop() {
    this.socketTransport.stop();
  }

  async flushBuffer() {
    const buffer = this.buffer;
    const failed: ServerAction[] = [];
    this.buffer = [];
    for (let i = 0; i < buffer.length; i++) {
      try {
        if (buffer[i].action === 'create' || buffer[i].action === 'update') {
          const resource = await this.collection.findOne({ id: buffer[i].resourceId });
          if (resource) {
            await this.callUpsert(resource, buffer[i].options);
          }
        }
        if (buffer[i].action === 'delete') {
          await this.callRemove(buffer[i].resourceId, buffer[i].options);
        }
      } catch (err) {
        console.log(err);
        failed.push(buffer[i]);
      }
    }
    this.buffer = this.buffer
      .filter(
        item => failed.filter(itemFailed => itemFailed.resourceId === item.resourceId).length === 0,
      )
      .concat(failed);

    //TODO move this timeout to a smarter retry system
    if (failed.length > 0) {
      setTimeout(() => {
        this.flushBuffer();
      }, 1000);
    }

    return true;
  }

  lockHttp() {
    this.httpUsed++;
  }
  unlockHttp() {
    this.httpUsed--;
    if (this.httpUsed === 0) this.socketTransport.flushWebsocketBuffer();
  }

  async get(options?: any) {
    this.lockHttp();
    try {
      const result = await Collections.getTransport()
        .getHttp()
        .get(this.collection.getPath().replace(/\/$/, '') + '?websockets=1');
      this.unlockHttp();

      if (result?.websockets) {
        this.socketTransport.updateWebsocketInformation(result?.websockets);
      }

      return result;
    } catch (err) {
      console.log(err);
      //TODO retry system
      this.unlockHttp();
    }
  }

  async upsert(resource: G, options: any) {
    this.buffer = this.buffer.filter(item => item.resourceId !== resource.id);

    this.buffer.push({
      action: resource.state.persisted ? 'update' : 'create',
      resourceId: resource.id,
      options: options || {},
    });

    this.flushBuffer();
  }

  async remove(resource: G, options: any) {
    this.buffer = this.buffer.filter(item => item.resourceId !== resource.id);

    if (resource.state.persisted) {
      this.buffer.push({
        action: 'delete',
        resourceId: resource.id,
        options: options || {},
      });

      this.flushBuffer();
    }
  }

  async callUpsert(resource: G, options: any) {
    this.lockHttp();
    try {
      const result = await Collections.getTransport()
        .getHttp()
        .post(this.collection.getPath().replace(/\/$/, resource.state.persisted ? '/' : ''), {
          resource: resource.data,
          options: options,
        });
      if (!result?.offline) {
        if (result?.resource) {
          resource.setPersisted(true);
          resource.data = Object.assign(resource.data, result?.resource);
          await this.collection.upsert(resource, { withoutBackend: true });
        } else {
          //This resource is invalid, remove it
          await this.collection.remove(resource, { withoutBackend: true });
        }
      }

      this.unlockHttp();

      return result;
    } catch (err) {
      console.log(err);
      this.unlockHttp();
      throw err;
    }
  }

  async callRemove(resourceId: string, options: any) {
    this.lockHttp();
    try {
      const result = await Collections.getTransport()
        .getHttp()
        .delete(this.collection.getPath() + resourceId);
      this.unlockHttp();

      return result;
    } catch (err) {
      console.log(err);
      this.unlockHttp();
      throw err;
    }
  }
}

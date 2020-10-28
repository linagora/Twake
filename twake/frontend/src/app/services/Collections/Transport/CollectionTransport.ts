import Collections, { Collection, Resource } from '../Collections';
import Storage from '../Storage';

type WebsocketEvent = { action: 'created' | 'updated' | 'deleted'; resource: any };
type ServerAction = {
  action: 'create' | 'update' | 'delete';
  resourceId: string;
  options: any;
};

export default class CollectionTransport<G extends Resource<any>> {
  private buffer: ServerAction[] = [];
  private websocketBuffer: WebsocketEvent[] = [];
  private httpUsed: number = 0;

  constructor(private readonly collection: Collection<G>) {
    //@ts-ignore
    window.CollectionTransport = this;
  }

  /**
   * This collection is visible, transport must start
   */
  start() {
    console.log('start listening to collection', this.collection.getPath());
    setTimeout(() => {
      Collections.getTransport()
        .getSocket()
        //TODO need to create a type for socket events
        .join('/channels' /*this.collection.getPath()*/, async (event: WebsocketEvent) => {
          this.websocketBuffer.push(event);
          if (this.httpUsed === 0) this.flushWebsocketBuffer();
        });
    }, 1000);
  }

  /**
   * This collection is not visible / used anymore, transport can stop
   */
  stop() {
    console.log('stop listening to collection', this.collection.getPath());
    Collections.getTransport().getSocket().leave(this.collection.getPath());
  }

  async onWebsocketEvent(action: string, resource: any) {
    if (action === 'created' || action === 'updated') {
      let localResource = await this.collection.findOne(resource.id);
      console.log(resource, localResource, new Date().getTime());
      if (!localResource) {
        localResource = new (this.collection.getType())(resource);
      }
      localResource.setShared();
      console.log(localResource);
      this.collection.upsert(localResource, {
        withoutBackend: true,
      });
    }
    if (action === 'deleted') {
      let localResource = await this.collection.findOne(resource.id);
      this.collection.remove(localResource, {
        withoutBackend: true,
      });
    }
  }

  async flushBuffer() {
    const buffer = this.buffer;
    const failed: ServerAction[] = [];
    this.buffer = [];
    for (let i = 0; i < buffer.length; i++) {
      try {
        if (buffer[i].action === 'create' || buffer[i].action === 'update') {
          await this.callUpsert(await this.collection.findOne({ id: buffer[i].resourceId }));
        }
        if (buffer[i].action === 'delete') {
          await this.callRemove(buffer[i].resourceId);
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

  flushWebsocketBuffer() {
    const buffer = this.websocketBuffer;
    this.websocketBuffer = [];
    buffer.forEach(event => {
      this.onWebsocketEvent(event.action, event.resource);
    });
  }

  lockHttp() {
    this.httpUsed++;
  }
  unlockHttp() {
    this.httpUsed--;
    if (this.httpUsed === 0) this.flushWebsocketBuffer();
  }

  async get(options?: any) {
    /*
    this.lockHttp();
    try {
      const result = await Collections.getTransport().getHttp().get(this.collection.getPath());
      this.unlockHttp();
      return result;
    } catch (err) {
      console.log(err);
      //TODO retry system
      this.unlockHttp();
    }*/
  }

  async upsert(resource: G) {
    this.buffer = this.buffer.filter(item => item.resourceId != resource.id);

    this.buffer.push({
      action: resource.state.persisted ? 'update' : 'create',
      resourceId: resource.id,
      options: {},
    });

    this.flushBuffer();
  }

  async remove(resource: G) {
    this.buffer = this.buffer.filter(item => item.resourceId != resource.id);

    if (resource.state.persisted) {
      this.buffer.push({
        action: 'delete',
        resourceId: resource.id,
        options: {},
      });

      this.flushBuffer();
    }
  }

  async callUpsert(resource: G) {
    this.lockHttp();
    try {
      const result = await Collections.getTransport()
        .getHttp()
        .post(this.collection.getPath(), resource.data);

      if (result?.resource) {
        resource.setPersisted(true);
        resource.data = Object.assign(resource.data, result?.resource);
        console.log(resource, '(upsert)', new Date().getTime());

        await this.collection.upsert(resource, { withoutBackend: true });
      } else {
        //This resource is invalid, remove it
        await this.collection.remove(resource, { withoutBackend: true });
      }

      this.unlockHttp();

      return result;
    } catch (err) {
      console.log(err);
      this.unlockHttp();
      throw err;
    }
  }

  async callRemove(resourceId: string) {
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

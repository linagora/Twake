import Collections, { Collection, Resource } from '../Collections';
import CollectionTransportSockets from './CollectionTransportSockets';

type ServerAction = {
  action: 'create' | 'update' | 'delete';
  resourceId: string;
  options: any;
  resolve: (resource: Resource<any> | string | null) => void;
  reject: (err: any) => void;
};

export default class CollectionTransport<G extends Resource<any>> {
  private socketTransport: CollectionTransportSockets<G> = new CollectionTransportSockets<G>(this);
  private buffer: ServerAction[] = [];
  httpUsed: number = 0;

  constructor(readonly collection: Collection<G>) {}

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
            const [httpResult, resourceSaved] = await this.callUpsert(resource, buffer[i].options);
            buffer[i].resolve(resourceSaved);
          } else {
            buffer[i].resolve(null);
          }
        }
        if (buffer[i].action === 'delete') {
          const [httpResult, resourceId] = await this.callRemove(
            buffer[i].resourceId,
            buffer[i].options,
          );
          buffer[i].resolve(resourceId);
        }
      } catch (err) {
        buffer[i].reject(err);
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

  async get(filter: any, options?: any) {
    this.lockHttp();
    try {
      const queryParameters = Object.keys(options || {}).map(
        k => k + '=' + encodeURIComponent(options[k]),
      );

      const getOneSuffix = filter?.id ? '/' + filter?.id : '';
      const result = await Collections.getTransport()
        .getHttp()
        .get(
          this.collection.getRestPath().replace(/\/$/, '') +
            getOneSuffix +
            '?websockets=1&' +
            queryParameters.join('&'),
        );
      this.unlockHttp();

      if (result?.websockets) {
        this.socketTransport.updateWebsocketInformation(result?.websockets);
      }

      if (result.offline) {
        return null;
      }

      return result;
    } catch (err) {
      console.log(err);
      //TODO retry system
      this.unlockHttp();
    }
    return null;
  }

  async upsert(resource: G, options: any): Promise<Resource<any> | string | null> {
    return new Promise((resolve, reject) => {
      this.buffer = this.buffer.filter(item => item.resourceId !== resource.id);

      this.buffer.push({
        action: resource.state.persisted ? 'update' : 'create',
        resourceId: resource.id,
        options: options || {},
        resolve: resolve,
        reject: reject,
      });

      this.flushBuffer();
    });
  }

  async remove(resource: G, options: any): Promise<Resource<any> | string | null> {
    return new Promise((resolve, reject) => {
      this.buffer = this.buffer.filter(item => item.resourceId !== resource.id);

      if (resource.state.persisted) {
        this.buffer.push({
          action: 'delete',
          resourceId: resource.id,
          options: options || {},
          resolve: resolve,
          reject: reject,
        });

        this.flushBuffer();
      } else {
        resolve();
      }
    });
  }

  async callUpsert(resource: G, options: any) {
    this.lockHttp();
    try {
      let resourceCreated = null;
      const result = await Collections.getTransport()
        .getHttp()
        .post(
          this.collection
            .getRestPath()
            .replace(/\/$/, resource.state.persisted ? '/' + resource.id : ''),
          {
            resource: resource.getDataForRest(),
            options: options,
          },
        );
      if (!result?.offline) {
        if (result?.resource) {
          resource.setPersisted(true);
          resource.data = Object.assign(resource.data, result?.resource);
          await this.collection.upsert(resource, { withoutBackend: true });
          resourceCreated = resource;
        } else if ([401].indexOf(result?.statusCode || 200) >= 0) {
          //This resource is invalid, remove it
          await this.collection.remove(resource, { withoutBackend: true });
        }
      }

      this.unlockHttp();

      return [result, resourceCreated];
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
        .delete(this.collection.getRestPath() + resourceId);
      this.unlockHttp();

      return [result, resourceId];
    } catch (err) {
      console.log(err);
      this.unlockHttp();
      throw err;
    }
  }
}

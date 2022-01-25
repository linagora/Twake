import Logger from 'app/services/Logger';
import { ActionOptions } from '../Collection';
import Collections, { Collection, Resource } from '../Collections';
import CollectionTransportSockets from './CollectionTransportSockets';

type ServerAction = {
  action: 'create' | 'update' | 'delete';
  resourceId: string;
  options: any;
  resolve: (resource: Resource<any> | string | null) => void;
  reject: (err: any) => void;
};

const logger = Logger.getLogger('Collections/Transport');

export default class CollectionTransport<G extends Resource<any>> {
  private socketTransport: CollectionTransportSockets<G> = new CollectionTransportSockets<G>(this);
  private buffer: ServerAction[] = [];
  httpUsed: number = 0;
  private didFirstStart: boolean = false;
  private stopTimeout: any = null;

  constructor(readonly collection: Collection<G>) {}

  /**
   * This collection is visible, transport must start
   */
  start() {
    logger.log('Start looking for changes on ', this.collection.getPath());
    if (this.stopTimeout) clearTimeout(this.stopTimeout);
    if (this.didFirstStart) {
      this.collection.reload('ontime');
    }
    this.socketTransport.start();
  }

  /**
   * This collection is not visible / used anymore, transport can stop
   */
  stop() {
    logger.log('Will stop looking for changes in 60 seconds on ', this.collection.getPath());
    this.didFirstStart = true;
    this.stopTimeout = setTimeout(() => {
      logger.log('Stop looking for changes on ', this.collection.getPath());
      this.socketTransport.stop();
    }, 60 * 1000); //Keep socket for some time
  }

  async flushBuffer() {
    const buffer = this.buffer;
    const failed: ServerAction[] = [];
    this.buffer = [];
    for (let i = 0; i < buffer.length; i++) {
      try {
        if (buffer[i].action === 'create' || buffer[i].action === 'update') {
          const resource = this.collection.findOne(buffer[i].resourceId);
          if (resource) {
            const [, resourceSaved] = await this.callUpsert(resource, buffer[i].options);
            buffer[i].resolve(resourceSaved);
          } else {
            buffer[i].resolve(null);
          }
        }
        if (buffer[i].action === 'delete') {
          const [, resourceId] = await this.callRemove(buffer[i].resourceId, buffer[i].options);
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
      const queryParameters = Object.keys(options || {}).map(k => {
        if (options[k] === true) options[k] = 1;
        if (options[k] === false) options[k] = 0;
        return k + '=' + encodeURIComponent(options[k]);
      });

      const getOneSuffix = filter?.id ? `/${filter?.id}` : '';
      const path = this.collection.getRestPath().replace(/\/$/, '');
      const result = await Collections.getTransport()
        .getHttp()
        .get(`${path}${getOneSuffix}?websockets=1&${queryParameters.join('&')}`);
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

      if (!resource.data[resource.getIdKey()]) {
        logger.error('upsert: Id key not found for resource', resource);
      }

      this.buffer.push({
        action: resource.state.persisted ? 'update' : 'create',
        resourceId: resource.data[resource.getIdKey()],
        options: options || {},
        resolve: resolve,
        reject: reject,
      });

      this.flushBuffer();
    });
  }

  async remove(resource: G, options?: any): Promise<Resource<any> | string | null> {
    return new Promise((resolve, reject) => {
      this.buffer = this.buffer.filter(item => item.resourceId !== resource.id);

      if (!resource.data[resource.getIdKey()]) {
        logger.error('remove: Id key not found for resource', resource);
      }

      this.buffer.push({
        action: 'delete',
        resourceId: resource.data[resource.getIdKey()],
        options: options || {},
        resolve: resolve,
        reject: reject,
      });

      this.flushBuffer();
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
          if (resource.getPrimaryKey().indexOf('tmp:') >= 0) {
            result.resource._primaryKey = result.resource[resource.getIdKey()];
          }
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

  async action(actionName: string, object: any, options?: ActionOptions) {
    try {
      let url = this.collection.getRestPath();
      if (options.onResourceId) {
        url = `${url}${options.onResourceId}/`;
      }
      url = `${url}${actionName}`;
      const result = await Collections.getTransport().getHttp().post(url, object);
      return result;
    } catch (err) {
      console.log(err);
      throw err;
    }
  }
}

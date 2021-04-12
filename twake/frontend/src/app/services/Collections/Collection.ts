import { assign, reject } from 'lodash';
import getStore, { CollectionStore } from './Storage';
import EventEmitter from './EventEmitter';
import Resource from './Resource';
import CollectionTransport from './Transport/CollectionTransport';
import FindCompletion from './Transport/CollectionFindCompletion';

/**
 * This is a Collection.
 * A Collection manage a list of Resources in a given path (ex. in the channel defined by the path /channels/{channel_id}/messages)
 * Each action done on this Collection will trigger calls to backend.
 */

export type GeneralOptions = {
  alwaysNotify: boolean;
  withoutBackend: boolean;
  query: any;
  callback: Function;
} & any;

export type ServerRequestOptions = {
  query: any;
  waitServerReply: boolean;
  refresh: true;
};

export type ActionOptions = {
  onResourceId: string;
} & GeneralOptions;

export type CollectionOptions = {
  tag?: string;
  queryParameters?: any;
  cacheReplaceMode?: 'always' | 'never';
  reloadStrategy?: 'ontime' | 'delayed' | 'none';
  storageKey?: string;
};

export default class Collection<R extends Resource<any>> {
  private options: CollectionOptions = {
    cacheReplaceMode: 'always',
    reloadStrategy: 'delayed',
    queryParameters: {},
  };

  protected eventEmitter: EventEmitter<R> = new EventEmitter(this, null);
  protected transport: CollectionTransport<R> = new CollectionTransport(this);
  protected completion: FindCompletion<R> = new FindCompletion(this);

  //App state
  private reloadRegistered = 0;
  private resources: { [id: string]: R } = {};
  private storage: CollectionStore;
  private completeTimeout: any = null;

  constructor(
    private readonly path: string = '',
    private readonly type: new (data: any) => R,
    options?: CollectionOptions,
  ) {
    if (options?.tag) this.path = path + '::' + options.tag;
    this.setOptions(options || {});
    this.storage = getStore(options?.storageKey || '');
  }

  public getPath() {
    return this.path;
  }

  public getOptions() {
    return this.options;
  }

  public getStorage(): CollectionStore {
    return this.storage;
  }

  public getEventEmitter(): EventEmitter<R> {
    return this.eventEmitter;
  }

  public setOptions(options: CollectionOptions) {
    this.options = assign(this.options, options);
  }

  public getTag() {
    return this.path.split('::')[1] || '';
  }

  public getRestPath() {
    return (this.path.split('::')[0] || '').split('?')[0];
  }

  public getTransport() {
    return this.transport;
  }

  public getType() {
    return this.type;
  }

  public getTypeName(): string {
    return new this.type({}).type;
  }

  /**
   * Share information through websocket without asking backend
   */
  public async share(eventName: string, object: any, options?: GeneralOptions): Promise<void> {
    return;
  }

  /**
   * Run an action on the backend (POST on `${this.path}/actionName`)
   */
  public async action(actionName: string, object: any, options?: ActionOptions): Promise<any> {
    return await this.transport.action(actionName, object, options);
  }

  /**
   * Insert document (this will call backend)
   */
  public insert = this.upsert;

  /**
   * Update document (this will call backend)
   */
  public update = this.upsert;

  /**
   * Upsert document (this will call backend)
   */
  public async upsert(item: R, options?: GeneralOptions & ServerRequestOptions): Promise<R> {
    if (!item) {
      return item;
    }

    const storage = this.getStorage();
    const mongoItem = storage.upsert(
      new this.type({}).type,
      this.getPath(),
      item.getDataForStorage(),
    );
    this.updateLocalResource(mongoItem, item);
    this.eventEmitter.notify();

    if (!options?.withoutBackend) {
      if (options?.waitServerReply) {
        const resourceSaved = await this.transport.upsert(
          this.resources[mongoItem.id],
          options?.query,
        );
        if (!resourceSaved) {
          this.remove(item, { withoutBackend: true });
        }
        return resourceSaved as R;
      } else {
        this.transport.upsert(this.resources[mongoItem.id], options?.query);
      }
    }

    return item ? this.resources[mongoItem.id] : item;
  }

  /**
   * Remove document (this will call backend)
   */
  public async remove(
    filter: R | any,
    options?: GeneralOptions & ServerRequestOptions,
  ): Promise<void> {
    if (filter?.constructor?.name && filter?.constructor?.name !== 'Object') {
      filter = filter.data || filter;
    }
    if (filter) {
      const resource = this.findOne(filter);
      if (resource) {
        const storage = this.getStorage();
        storage.remove(this.getTypeName(), this.getPath(), filter);
        this.removeLocalResource(filter.id);
        this.eventEmitter.notify();
        if (!options?.withoutBackend && resource.state.persisted) {
          this.transport.remove(resource, options?.query);
        }
      }
    }
    if (options?.alwaysNotify) {
      this.eventEmitter.notify();
    }
    return;
  }

  public async get(
    filter?: any,
    options: GeneralOptions & ServerRequestOptions = {},
  ): Promise<R[]> {
    return new Promise((resolve, reject) => {
      try {
        this.find(filter, {
          refresh: true,
          callback: (items: R[]) => {
            resolve(items);
          },
          ...options,
        });
      } catch (err) {
        reject(err);
      }
    });
  }

  /**
   * Find documents according to a filter and some option (sorting etc)
   * This will call backend if we ask for more items than existing in frontend.
   */
  public find(filter?: any, options: GeneralOptions & ServerRequestOptions = {}): R[] {
    options.query = { ...(this.getOptions().queryParameters || {}), ...(options.query || {}) };
    const storage = this.getStorage();
    let mongoItems = storage.find(this.getTypeName(), this.getPath(), filter, options);

    if (typeof filter === 'string' || filter?.id) {
      return [this.findOne(filter, options)];
    }

    if (!options?.withoutBackend) {
      if (!this.completion.isLocked || options?.refresh) {
        this.completion
          .completeFind(mongoItems, filter, options)
          .then(async mongoItems => {
            if (mongoItems.length > 0) {
              mongoItems.forEach(mongoItem => {
                this.updateLocalResource(mongoItem);
              });
              this.eventEmitter.notify();
            }

            if (options?.callback) {
              options?.callback(mongoItems.map(mongoItem => this.resources[mongoItem.id]));
            }
          })
          .catch(err => {
            throw err;
          });
      } else {
        this.completeTimeout && clearTimeout(this.completeTimeout);
        this.completeTimeout = setTimeout(() => {
          this.find(filter, options);
        }, 1000);
      }
    }

    mongoItems.forEach(mongoItem => {
      this.updateLocalResource(mongoItem);
    });

    return mongoItems.map(mongoItem => this.resources[mongoItem.id]);
  }

  /**
   * Find a specific document
   * This will call backend if we don't find this document in frontend.
   */
  public findOne(filter?: any, options: GeneralOptions & ServerRequestOptions = {}): R {
    if (typeof filter === 'string') {
      let _filter: any = {};
      _filter[new this.type({}).getIdKey()] = filter;
      filter = _filter;
    }

    options.query = { ...(this.getOptions().queryParameters || {}), ...(options.query || {}) };
    const storage = this.getStorage();
    let mongoItem = storage.findOne(this.getTypeName(), this.getPath(), filter, options);

    if (
      (!mongoItem && (filter.id || '').indexOf('tmp:') < 0 && !options?.withoutBackend) ||
      options?.refresh
    ) {
      if (!this.completion.isLocked) {
        this.completion.completeFindOne(filter, options).then(async mongoItem => {
          if (mongoItem) {
            this.eventEmitter.notify();
          }
        });
      } else {
        this.completeTimeout && clearTimeout(this.completeTimeout);
        this.completeTimeout = setTimeout(() => {
          this.findOne(filter, options);
        }, 1000);
      }
    }

    if (mongoItem) {
      this.updateLocalResource(mongoItem);
    }
    return mongoItem ? this.resources[mongoItem.id] : mongoItem;
  }

  /**
   * Reload collection after socket was disconnected
   */
  public async reload(strategy: string = '') {
    if (new Date().getTime() - this.reloadRegistered < 1000) {
      return;
    }
    this.reloadRegistered = new Date().getTime();
    strategy = strategy || this.options.reloadStrategy || 'never';
    if (strategy === 'delayed') {
      setTimeout(() => {
        this.find({}, { refresh: true });
      }, 1000 + 15000 * Math.random());
    } else if (strategy === 'ontime') {
      this.find({}, { refresh: true });
    }
  }

  private updateLocalResource(mongoItem: any, item?: R) {
    if (mongoItem) {
      if (!item) {
        if (this.resources[mongoItem.id]) {
          item = this.resources[mongoItem.id];
        } else {
          item = new this.type(mongoItem);
          item.state = mongoItem._state;
          item.setUpToDate(false);
        }
      }
      item.setCollection(this);
      item.data = assign(mongoItem, item.data);
      this.resources[mongoItem.id] = item;
    }
  }

  private removeLocalResource(id: string) {
    if (id) {
      delete this.resources[id];
    }
  }
}

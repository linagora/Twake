import { assign } from 'lodash';
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
  force: boolean;
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

type ReloadStrategy = 'ontime' | 'delayed' | 'none';

export type CollectionOptions = {
  tag?: string;
  queryParameters?: any;
  cacheReplaceMode?: 'always' | 'never';
  reloadStrategy?: ReloadStrategy;
  storageKey?: string;
};

/**
 * A generic collection of resources. 
 */
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
  private resources = new Map<string, R>();
  private storage: CollectionStore;
  private completeTimeout: any = null;
  private readonly emptyInstance: R;

  constructor(
    private readonly path: string = '',
    private readonly type: new (data: any) => R,
    options?: CollectionOptions,
  ) {
    if (options?.tag) this.path = `${path}::${options.tag}`;
    this.setOptions(options || {});
    this.storage = getStore(options?.storageKey || '');
    this.emptyInstance = new type({});
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

  public setOptions(options: CollectionOptions): this {
    this.options = assign(this.options, options);
    return this;
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
    return this.emptyInstance.type;
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
    const storageItem = storage.upsert(
      this.getTypeName(),
      this.getPath(),
      item.getDataForStorage(),
    );
    this.updateLocalResource(storageItem, item);
    this.eventEmitter.notify();

    const resource = this.resources.get(storageItem.id);
    if (!resource) {
      return item;
    }

    if (!options?.withoutBackend) {
      if (options?.waitServerReply) {
        const resourceSaved = await this.transport.upsert(
          resource,
          options?.query,
        );

        if (!resourceSaved) {
          this.remove(item, { withoutBackend: true });
        }

        return resourceSaved as R;
      } else {
        this.transport.upsert(resource, options?.query);
      }
    }

    return item && this.resources.has(storageItem.id) ? this.resources.get(storageItem.id)! : item;
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
      let resource = this.findOne(filter) || new this.type(filter);
      if (resource) {
        const storage = this.getStorage();
        storage.remove(this.getTypeName(), this.getPath(), filter);
        this.removeLocalResource(filter.id);
        this.eventEmitter.notify();
        if ((resource && !options?.withoutBackend && resource.state.persisted) || options?.force) {
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
    const storageItems = storage.find(this.getTypeName(), this.getPath(), filter, options);

    if (typeof filter === 'string' || filter?.id) {
      return [this.findOne(filter, options)];
    }

    if (!options?.withoutBackend) {
      if (!this.completion.isLocked || options?.refresh) {
        this.completion
          .completeFind(storageItems, filter, options)
          .then(async storageItems => {
            if (storageItems.length > 0) {
              storageItems.forEach(storageItem => {
                this.updateLocalResource(storageItem);
              });
              this.eventEmitter.notify();
            }

            if (options?.callback) {
              options?.callback(storageItems.map(storageItem => this.resources.get(storageItem.id)));
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

    storageItems.forEach(storageItem => this.updateLocalResource(storageItem));

    return storageItems.map(storageItem => (this.resources.get(storageItem.id) as R)).filter(Boolean);
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
    let storageItem = storage.findOne(this.getTypeName(), this.getPath(), filter, options);

    if (
      (!storageItem && (filter.id || '').indexOf('tmp:') < 0 && !options?.withoutBackend) ||
      options?.refresh
    ) {
      if (!this.completion.isLocked) {
        this.completion.completeFindOne(filter, options).then(async storageItem => {
          if (storageItem) {
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

    if (storageItem) {
      this.updateLocalResource(storageItem);
    }
    return storageItem ? this.resources.get(storageItem.id) : storageItem;
  }

  /**
   * Reload collection after socket was disconnected
   */
  public async reload(strategy?: ReloadStrategy | 'never') {
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

  private updateLocalResource(storageItem: any, item?: R): void {
    if (!storageItem) {
      return;
    }

    if (!item) {
      if (this.resources.has(storageItem.id)) {
        item = this.resources.get(storageItem.id);
      } else {
        item = new this.type(storageItem);
        item.state = storageItem._state;
        item.setUpToDate(false);
      }
    }

    if (item) {
      item.setCollection(this);
      item.data = assign(storageItem, item!.data);
      this.resources.set(storageItem.id, item!);
    }
  }

  private removeLocalResource(id: string) {
    this.resources.delete(id);
  }
}

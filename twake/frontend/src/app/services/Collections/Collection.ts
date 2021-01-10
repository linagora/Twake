import Storage from './Storage';
import EventEmitter from './EventEmitter';
import Resource from './Resource';
import CollectionTransport from './Transport/CollectionTransport';
import FindCompletion from './Transport/CollectionFindCompletion';
import _ from 'lodash';

/**
 * This is a Collection.
 * A Collection manage a list of Resources in a given path (ex. in the channel defined by the path /channels/{channel_id}/messages)
 * Each action done on this Collection will trigger calls to backend.
 */

export type GeneralOptions = {
  alwaysNotify: boolean;
  withoutBackend: boolean;
  query: any;
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
  idGenerator?: (data: any) => string;
  cacheReplaceMode?: 'always' | 'never';
  reloadStrategy?: 'ontime' | 'delayed' | 'none';
};

export default class Collection<G extends Resource<any>> {
  protected eventEmitter: EventEmitter<G> = new EventEmitter(this, null);
  protected transport: CollectionTransport<G> = new CollectionTransport(this);
  protected completion: FindCompletion<G> = new FindCompletion(this);
  private options: CollectionOptions = {
    cacheReplaceMode: 'always',
    reloadStrategy: 'delayed',
    queryParameters: {},
  };

  //App state
  private reloadRegistered = 0;
  private resources: { [id: string]: G } = {};

  constructor(
    private readonly path: string = '',
    private readonly type: new (data: any) => G,
    options?: CollectionOptions,
  ) {
    if (options?.tag) this.path = path + '::' + options.tag;
    this.setOptions(options || {});
  }

  public getPath() {
    return this.path;
  }

  public getOptions() {
    return this.options;
  }

  public setOptions(options: CollectionOptions) {
    this.options = _.assign(this.options, options);
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
  public async upsert(item: G, options?: GeneralOptions & ServerRequestOptions): Promise<G> {
    const mongoItem = await Storage.upsert(this.getPath(), item.getDataForStorage());
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
        return resourceSaved as G;
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
    filter: G | any,
    options?: GeneralOptions & ServerRequestOptions,
  ): Promise<void> {
    if (filter?.constructor?.name && filter?.constructor?.name !== 'Object') {
      filter = filter.data || filter;
    }
    if (filter) {
      const resource = await this.findOne(filter);
      if (resource) {
        await Storage.remove(this.getPath(), filter);
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

  /**
   * Find documents according to a filter and some option (sorting etc)
   * This will call backend if we ask for more items than existing in frontend.
   */
  public async find(
    filter?: any,
    options: GeneralOptions & ServerRequestOptions = {},
  ): Promise<G[]> {
    options.query = { ...(this.getOptions().queryParameters || {}), ...(options.query || {}) };
    let mongoItems = await Storage.find(this.getPath(), filter, options);

    if (typeof filter === 'string' || filter?.id) {
      return [await this.findOne(filter, options)];
    }

    await this.completion.wait();
    this.completion.completeFind(mongoItems, filter, options).then(async mongoItems => {
      if (mongoItems.length > 0) {
        mongoItems.forEach(mongoItem => {
          this.updateLocalResource(mongoItem);
        });
        this.eventEmitter.notify();
      }
      await this.completion.unlock();
    });

    mongoItems.forEach(mongoItem => {
      this.updateLocalResource(mongoItem);
    });

    return mongoItems.map(mongoItem => this.resources[mongoItem.id]);
  }

  /**
   * Find a specific document
   * This will call backend if we don't find this document in frontend.
   */
  public async findOne(
    filter?: any,
    options: GeneralOptions & ServerRequestOptions = {},
  ): Promise<G> {
    if (typeof filter === 'string') {
      filter = { id: filter };
    }

    await this.completion.wait();

    options.query = { ...(this.getOptions().queryParameters || {}), ...(options.query || {}) };
    let mongoItem = await Storage.findOne(this.getPath(), filter, options);

    if (!mongoItem) {
      await this.completion.wait();
      this.completion.completeFindOne(filter, options).then(async mongoItem => {
        if (mongoItem) {
          this.eventEmitter.notify();
        }
        await this.completion.unlock();
      });
    }

    if (mongoItem) {
      this.updateLocalResource(mongoItem);
    }
    return mongoItem ? this.resources[mongoItem.id] : mongoItem;
  }

  /**
   * Reload collection after socket was disconnected
   */
  public async reload() {
    if (new Date().getTime() - this.reloadRegistered < 1000) {
      return;
    }
    this.reloadRegistered = new Date().getTime();
    if (this.options.reloadStrategy === 'delayed') {
      setTimeout(() => {
        this.find({}, { refresh: true });
      }, 1000 + 15000 * Math.random());
    } else if (this.options.reloadStrategy === 'ontime') {
      await this.find({}, { refresh: true });
    }
  }

  private updateLocalResource(mongoItem: any, item?: G) {
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
      item.data = _.assign(mongoItem, item.data);
      this.resources[mongoItem.id] = item;
    }
  }

  private removeLocalResource(id: string) {
    if (id) {
      delete this.resources[id];
    }
  }
}

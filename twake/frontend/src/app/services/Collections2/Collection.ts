import CollectionStorage from './CollectionStorage';
import Collections from './Collections';
import EventEmitter from './EventEmitter';
import Resource from './Resource';

/**
 * This is a Collection.
 * A Collection manage a list of Resources in a given path (ex. in the channel defined by the path /channels/{channel_id}/messages)
 * Each action done on this Collection will trigger calls to backend.
 */

type GeneralOptions = {
  withoutBackend: boolean;
} & any;

export default class Collection<G extends Resource<any>> {
  private resources: { [id: string]: G } = {};
  protected eventEmitter: EventEmitter = new EventEmitter(null);

  constructor(private readonly path: string = '', private readonly type: new (data: any) => G) {}

  public attachEventEmitter = this.eventEmitter.attachEventEmitter;

  /**
   * Share information through websocket without asking backend
   */
  public async share(eventName: string, object: any, options?: GeneralOptions): Promise<void> {
    return;
  }

  /**
   * Run an action on the backend (POST on `${this.path}/actionName`)
   */
  public async action(actionName: string, object: any, options?: GeneralOptions): Promise<any> {
    return {};
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
  public async upsert(item: G, options?: GeneralOptions): Promise<G> {
    const mongoItem = await CollectionStorage.upsert(this.path, {
      ...item.data,
      _state: item.state,
    });
    this.updateLocalResource(mongoItem, item);
    this.eventEmitter.notify();

    return item ? this.resources[mongoItem.id] : item;
  }

  /**
   * Remove document (this will call backend)
   */
  public async remove(filter: G | any, options?: GeneralOptions): Promise<void> {
    if (filter?.constructor?.name) {
      filter = filter.data;
    }
    if (filter) {
      await CollectionStorage.remove(this.path, filter);
      this.removeLocalResource(filter.id);
      this.eventEmitter.notify();
    }
    return;
  }

  /**
   * Find documents according to a filter and some option (sorting etc)
   * This will call backend if we ask for more items than existing in frontend.
   */
  public async find(filter?: any, options?: GeneralOptions): Promise<G[]> {
    const mongoItems = await CollectionStorage.find(this.path, filter, options);
    mongoItems.forEach(mongoItem => {
      this.updateLocalResource(mongoItem);
    });
    return mongoItems.map(mongoItem => this.resources[mongoItem.id]);
  }

  /**
   * Find a specific document
   * This will call backend if we don't find this document in frontend.
   */
  public async findOne(filter?: any, options?: GeneralOptions): Promise<G> {
    if (typeof filter === 'string') {
      filter = { id: filter };
    }
    const mongoItem = await CollectionStorage.findOne(this.path, filter, options);
    this.updateLocalResource(mongoItem);
    return mongoItem ? this.resources[mongoItem.id] : mongoItem;
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
      item.data = mongoItem;
      this.resources[mongoItem.id] = item;
    }
  }

  private removeLocalResource(id: string) {
    if (id) {
      delete this.resources[id];
    }
  }
}

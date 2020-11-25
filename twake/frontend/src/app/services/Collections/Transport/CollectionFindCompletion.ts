import Collection, { GeneralOptions } from '../Collection';
import Resource from '../Resource';
import Storage, { MongoItemType } from '../Storage';

/**
 * Autocomplete local collection repository with backend components
 */
export default class FindCompletion<G extends Resource<any>> {
  private didLoadOnce: boolean = false;
  private nextPageToken: null | string = null;
  private hasMore: boolean = true;
  private perPage: number = 0;
  private isLocked: boolean = false;
  private lockWaitCallbacks: Function[] = [];

  constructor(readonly collection: Collection<G>) {}

  /**
   * Take a list of mongoItems and complete (if needed) with new backend items
   * @param mongoItems
   * @param filter
   * @param options
   */
  public async completeFind(
    mongoItems: MongoItemType[],
    filter?: any,
    options?: GeneralOptions,
  ): Promise<MongoItemType[]> {
    options = options || {};
    options.query = {
      ...options.query,
    };
    if (options.limit) options.query.limit = options.limit || 100;
    if (options.page_token) options.query.page_token = options.page_token;
    if (options.search_query) options.query.search_query = options.search_query;

    const newItems = [];

    //Not taking cache replacement into account if network
    if (!this.didLoadOnce || (this.hasMore && options.limit > mongoItems.length)) {
      this.perPage = this.perPage || options.limit;
      options.query.limit = this.perPage;
      if (this.nextPageToken) {
        options.query.page_token = this.nextPageToken;
      }

      const items = await this.collection.getTransport().get(filter, options?.query);

      if (!this.nextPageToken && this.collection.getOptions().cacheReplaceMode === 'always') {
        Storage.clear(this.collection.getPath());
      }

      if (items?.resources && items?.resources?.length) {
        const type = this.collection.getType();
        const list = items?.resources as any[];
        for (let i = 0; i < list.length; i++) {
          const resource = new type(list[i]);
          resource.setShared(true);
          const mongoItem = await Storage.upsert(
            this.collection.getPath(),
            resource.getDataForStorage(),
          );
          newItems.push(mongoItem);
        }
      }

      if (this.nextPageToken == items?.next_page_token || !items?.next_page_token) {
        this.hasMore = false;
      }
      this.nextPageToken = items?.next_page_token;
      this.didLoadOnce = true;
    }

    return newItems;
  }

  /**
   * Get an item from backend if not found in frontend
   * @param filter
   * @param options
   */
  public async completeFindOne(
    filter?: any,
    options?: GeneralOptions,
  ): Promise<MongoItemType | null> {
    options = options || {};
    options.query = {
      ...options.query,
    };
    if (options.limit) options.query.limit = options.limit || 100;
    if (options.page_token) options.query.page_token = options.page_token;
    if (options.search_query) options.query.search_query = options.search_query;

    filter = filter || {};
    filter.id = filter.id || 'no-id';

    let mongoItem: MongoItemType | null = null;
    const item = await this.collection.getTransport().get(filter, options?.query);
    if (item?.resource) {
      const type = this.collection.getType();
      const data = item?.resource;
      const resource = new type(data);
      resource.setShared(true);
      mongoItem = await Storage.upsert(this.collection.getPath(), resource.getDataForStorage());
    }

    return mongoItem;
  }

  public async wait() {
    if (this.isLocked) {
      await new Promise(resolve => this.lockWaitCallbacks.push(resolve));
    }
  }

  public async lock() {
    this.isLocked = true;
  }

  public async unlock() {
    this.isLocked = false;
    this.lockWaitCallbacks.forEach(resolve => resolve());
    this.lockWaitCallbacks = [];
  }
}

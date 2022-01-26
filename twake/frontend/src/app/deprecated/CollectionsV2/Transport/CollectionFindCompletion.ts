import Collection, { GeneralOptions } from '../Collection';
import Resource from '../Resource';
import { MongoItemType } from '../Storage';

/**
 * Autocomplete local collection repository with backend components
 */
export default class FindCompletion<G extends Resource<any>> {
  private didLoadOnce: boolean = false;
  private nextPageToken: null | string = null;
  private hasMore: boolean = true;
  private perPage: number = 0;
  public isLocked: boolean = false;

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
    this.isLocked = true;

    try {
      options = options || {};
      options.query = {
        ...options.query,
      };
      if (options.limit) options.query.limit = options.limit || 100;
      if (options.page_token) options.query.page_token = options.page_token;
      if (options.search_query) options.query.search_query = options.search_query;

      const newItems = [];

      //Not taking cache replacement into account if network
      if (
        options.refresh ||
        !this.didLoadOnce ||
        (this.hasMore && options.limit > mongoItems.length)
      ) {
        this.perPage = options.query.page_token ? this.perPage : options.query.limit;
        options.query.limit = this.perPage;
        if (this.nextPageToken) {
          options.query.page_token = this.nextPageToken;
        }

        this.collection.getEventEmitter().emit('http:loading', true);

        const items = await this.collection.getTransport().get(filter, options?.query);

        if (items?.resources?.length !== undefined) {
          if (!this.nextPageToken && this.collection.getOptions().cacheReplaceMode === 'always') {
            const storage = this.collection.getStorage();
            storage.clear(this.collection.getTypeName(), this.collection.getPath());
          }

          if (items?.resources && items?.resources?.length) {
            const type = this.collection.getType();
            const list = items?.resources as any[];
            for (let i = 0; i < list.length; i++) {
              const resource = new type(list[i]);
              resource.setShared(true);
              const storage = this.collection.getStorage();
              const mongoItem = storage.upsert(
                this.collection.getTypeName(),
                this.collection.getPath(),
                resource.getDataForStorage(),
              );
              newItems.push(mongoItem);
            }
          }

          if (this.nextPageToken === items?.next_page_token || !items?.next_page_token) {
            this.hasMore = false;
          }
          this.nextPageToken = items?.next_page_token;
          this.didLoadOnce = true;

          this.collection.getEventEmitter().emit('http:loading', false);
        } else {
          this.isLocked = false;
          return [];
        }
      }

      this.isLocked = false;
      return newItems;
    } catch (err) {
      this.isLocked = false;
      return [];
    }
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
    this.isLocked = true;
    try {
      options = options || {};
      options.query = {
        ...options.query,
      };
      if (options.limit) options.query.limit = options.limit || 100;
      if (options.page_token) options.query.page_token = options.page_token;
      if (options.search_query) options.query.search_query = options.search_query;

      filter = filter || {};
      if (!filter.id) {
        this.isLocked = false;
        return null;
      }

      this.collection.getEventEmitter().emit('http:loading', true);

      let mongoItem: MongoItemType | null = null;
      const item = await this.collection.getTransport().get(filter, options?.query);
      const storage = this.collection.getStorage();
      if (item?.resource) {
        const type = this.collection.getType();
        const data = item?.resource;
        const resource = new type(data);

        resource.setShared(true);
        mongoItem = storage.upsert(
          this.collection.getTypeName(),
          this.collection.getPath(),
          resource.getDataForStorage(),
        );
      }

      this.collection.getEventEmitter().emit('http:loading', false);

      this.isLocked = false;

      return mongoItem;
    } catch (err) {
      this.isLocked = false;
      return null;
    }
  }
}

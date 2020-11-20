import Collection, { GeneralOptions } from '../Collection';
import Resource from '../Resource';

/**
 * Autocomplete local collection repository with backend components
 */
export default class FindCompletion<G extends Resource<any>> {
  constructor(readonly collection: Collection<G>) {}

  /**
   * Take a list of mongoItems and complete (if needed) with new backend items
   * @param mongoItems
   * @param filter
   * @param options
   */
  public async completeFind(mongoItems: G[], filter?: any, options?: GeneralOptions): Promise<G[]> {
    options = options || {};
    options.httpOptions = {
      ...options.httpOptions,
      max_results: options.max_results || 100,
    };
    if (options.page_token) options.httpOptions.page_token = options.page_token;

    if (options.search_query) options.httpOptions.search_query = options.search_query;

    if (mongoItems.length >= 1) {
      return mongoItems;
    }

    const items = await this.collection.getTransport().get(filter, options?.httpOptions);

    if (items?.resources && items?.resources?.length) {
      const type = this.collection.getType();
      (items?.resources as any[]).forEach(resource => {
        const mongoItem = new type(resource);
        this.collection.upsert(mongoItem, { withoutBackend: true });
        mongoItems.push(mongoItem);
      });
    }

    return mongoItems;
  }

  /**
   * Get an item from backend if not found in frontend
   * @param filter
   * @param options
   */
  public async completeFindOne(filter?: any, options?: GeneralOptions): Promise<G | null> {
    options = options || {};
    options.httpOptions = {
      ...options.httpOptions,
      max_results: options.max_results || 100,
    };
    if (options.page_token) options.httpOptions.page_token = options.page_token;

    if (options.search_query) options.httpOptions.search_query = options.search_query;

    filter = filter || {};
    filter.id = filter.id || 'no-id';

    let mongoItem: G | null = null;
    const item = await this.collection.getTransport().get(filter, options?.httpOptions);
    if (item?.resource) {
      const type = this.collection.getType();
      mongoItem = new type(item?.resource);
      this.collection.upsert(mongoItem, { withoutBackend: true });
    }

    return mongoItem;
  }
}

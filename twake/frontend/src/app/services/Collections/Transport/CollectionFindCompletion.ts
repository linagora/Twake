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

    const items = await this.collection.getTransport().get(filter, options?.httpOptions);
    console.log(items);

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

    const item = await this.collection.getTransport().get(filter, options?.httpOptions);

    return null;
  }
}

type Direction = "up" | "down";

export type FeedResponse<T> = {
  /**
   * The request parameters which produced this response
   */
  query: NextParameters & { pageSize: number };

  /**
   * The offsets to be used for the next queries
   */
  offsets: {
    up: string;
    down: string;
  },

  /**
   * When the stream end has been reached (top or bottom):
   * - Bottom may switch from true to false if new items are added
   * - Top may not switch from true to false since we can not create items in the past.
   */
  completes: {
    top: boolean;
    bottom: boolean;
  }

  /**
   * A list of items
   */
  items: Array<T>;

  /**
   * false messages were not loaded for some reason 
   */
  loaded: boolean;

  /**
   * Set when an error occured
   */
  err?: Error;
};

export type InitParameters = {
  /**
   * Initial offset to load at a given position
   */
  offset?: string;

  /**
   * Number of items to fetch
   */
  pageSize?: number;
}

export type NextParameters = {
  /**
   * Load previous (up) or next (down) messages
   */
  direction: Direction;

  /**
   * Load from here
   */
  offset?: string;
}

export type FeedListeners<T> = {
  onCreated?(items: T[]): void;
  onUpdated?(items: T[]): void;
  onDeleted?(items: T[]): void;
};

/**
 * Loader interface
 */
export interface FeedLoader<T> {
  /**
   * Init the loader, called once
   *
   * @param parameters
   */
  init(parameters: InitParameters): Promise<any>;

  /**
   * Load next page
   *
   * @param parameters
   */
  nextPage(parameters: NextParameters): Promise<FeedResponse<T>>;

  /**
   * Get the already loaded items
   */
  getItems(): T[];

  destroy?(): void;
}

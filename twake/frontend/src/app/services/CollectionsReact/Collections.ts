import _ from 'lodash';
import { CollectionOptions } from '../Collections/Collection';
import OriginalCollections, {
  Collection as OriginalCollection,
  Resource as OriginalResource,
  EventEmitter as CollectionsEventEmitter,
} from '../Collections/Collections';
import Observable from '../Observable/Observable';

export { Resource } from '../Collections/Collections';

class ObservableAdapter extends Observable {
  static observables: { [key: string]: ObservableAdapter } = {};
  static getObservableForKey(key: string) {
    ObservableAdapter.observables[key] =
      ObservableAdapter.observables[key] || new ObservableAdapter();
    return ObservableAdapter.observables[key];
  }
}

export class Collection<G extends OriginalResource<any>> extends OriginalCollection<G> {
  protected observable: ObservableAdapter;
  protected eventEmitter: CollectionsEventEmitter<G>;
  useWatcher: (filter?: any, options?: any) => G[];
  useEvent: <G>(observedScope: () => G | Promise<G>, options?: any) => G;
  addWatcher: (
    callback: (transform: any) => void,
    filter?: any,
    options?: any,
  ) => {
    callback: (transform: any) => void;
    observedScope: () => any;
    savedChanges: any;
    options?: any;
  };
  removeWatcher: (callback: (transform: any) => void) => void;
  addEventListener: (
    callback: (transform: any) => void,
    observedScope: () => any,
    options?: any,
  ) => {
    callback: (transform: any) => void;
    observedScope: () => any;
    savedChanges: any;
    options?: any;
  };
  removeEventListener: (callback: (transform: any) => void) => void;

  constructor(path: string = '', type: new (data: any) => G) {
    super(path, type);
    this.observable = ObservableAdapter.getObservableForKey(path);
    this.eventEmitter = new CollectionsEventEmitter(this, this.observable);

    this.useWatcher = (filter?: any, options?: any): G[] =>
      this.observable.useWatcher(...this.getWatcherArgs(filter, options)) || [];
    this.useEvent = this.observable.useWatcher.bind(this.observable);

    this.addWatcher = (callback: (transform: any) => void, filter?: any, options?: any) =>
      this.observable.addWatcher(callback, ...this.getWatcherArgs(filter, options));
    this.removeWatcher = this.observable.removeWatcher.bind(this.observable);
    this.addEventListener = this.observable.addWatcher.bind(this.observable);
    this.removeEventListener = this.observable.removeWatcher.bind(this.observable);
  }

  public static get<T extends OriginalResource<any>>(
    path: string,
    type: new (data: any) => T,
    options?: CollectionOptions,
  ): Collection<T> {
    const creator = () => new Collection<T>(path, type);
    return OriginalCollections.get(path, type, creator, options) as Collection<T>;
  }

  private observedChangesReactOptionsAdapter = (observedFields: string[]) => {
    return (changes: any) => {
      if (changes?.constructor?.name === 'Array' && changes.length > 1) {
        return changes
          .map((e: any) => {
            const observed = observedFields
              .map(k => _.get(e.data, k) || _.get(e, k))
              .filter(exist => exist);
            return observed.length > 0 ? observed : e;
          })
          .map((e: any) => e?.data || e);
      }
      return changes.map((e: any) => e?.data || e);
    };
  };

  private getWatcherArgs = (filter?: any, options?: any): [() => Promise<G[]>, any] => {
    return [
      async () => await this.find(filter || {}, options || {}),
      {
        observedChanges:
          options?.observedChanges ||
          this.observedChangesReactOptionsAdapter(options?.observedFields || ['id']),
        memoizedFilters: [JSON.stringify(options), ...Object.values(filter)],
        ...options,
      },
    ];
  };
}

export default class Collections {
  public static get = Collection.get;
}

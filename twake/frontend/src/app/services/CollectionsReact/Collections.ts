import { CollectionOptions } from '../Collections/Collection';
import OriginalCollections, {
  Collection as OriginalCollection,
  Resource as OriginalResource,
  EventEmitter as CollectionsEventEmitter,
} from '../Collections/Collections';
import Observable from '../Observable/Observable';

export { Resource } from '../Collections/Collections';
export { default } from '../Collections/Collections';

class ObservableAdapter extends Observable {}

export class Collection<G extends OriginalResource<any>> extends OriginalCollection<G> {
  protected observable: ObservableAdapter = new ObservableAdapter();
  protected eventEmitter: CollectionsEventEmitter<G> = new CollectionsEventEmitter(
    this,
    this.observable,
  );

  constructor(path: string = '', type: new (data: any) => G) {
    super(path, type);
  }

  public static get<T extends OriginalResource<any>>(
    path: string,
    type: new (data: any) => T,
    options?: CollectionOptions,
  ): Collection<T> {
    return OriginalCollections.get(
      path,
      type,
      () => new Collection<T>(path, type),
      options,
    ) as Collection<T>;
  }

  private observedChangesReactOptionsAdapter = (changes: any) => {
    if (changes?.constructor?.name === 'Array' && changes.length > 1) {
      return changes.map((e: any) => e?.id || e);
    }
    return changes;
  };

  private getWatcherArgs = (filter?: any, options?: any): [() => Promise<G[]>, any] => {
    return [
      async () => await this.find(filter || {}, options || {}),
      {
        observedChanges: this.observedChangesReactOptionsAdapter,
        memoizedFilters: [JSON.stringify(options)],
      },
    ];
  };

  public useWatcher = (filter?: any, options?: any) =>
    this.observable.useWatcher(...this.getWatcherArgs(filter, options));
  public useEvent = this.observable.useWatcher.bind(this.observable);

  public addWatcher = (callback: (transform: any) => void, filter?: any, options?: any) =>
    this.observable.addWatcher(callback, ...this.getWatcherArgs(filter, options));
  public removeWatcher = this.observable.removeWatcher.bind(this.observable);
  public addEventListener = this.observable.addWatcher.bind(this.observable);
  public removeEventListener = this.observable.removeWatcher.bind(this.observable);
}

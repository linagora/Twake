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
  ): Collection<T> {
    return OriginalCollections.get(path, type, () => new Collection<T>(path, type)) as Collection<
      T
    >;
  }

  private observedChangesReactOptionsAdapter = (changes: any) => {
    if (changes?.constructor?.name === 'Array' && changes.length > 1) {
      return changes.map((e: any) => e?.id || e);
    }
    return changes;
  };

  public useWatcher = <G>(observedScope: () => Promise<G>, options?: any) =>
    this.observable.useWatcher(observedScope, {
      observedChanges: this.observedChangesReactOptionsAdapter,
      ...options,
    });
  public useEvent = this.observable.useWatcher.bind(this.observable);

  public addWatcher = <G>(
    callback: (transform: any) => void,
    observedScope: () => Promise<G>,
    options?: any,
  ) =>
    this.observable.addWatcher(callback, observedScope, {
      observedChanges: this.observedChangesReactOptionsAdapter,
      ...options,
    });
  public removeWatcher = this.observable.removeWatcher.bind(this.observable);
  public addEventListener = this.observable.addWatcher.bind(this.observable);
  public removeEventListener = this.observable.removeWatcher.bind(this.observable);
}

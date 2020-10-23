import { EventEmitter } from 'events';
import OriginalCollections, {
  Collection as OriginalCollection,
  Resource as OriginalResource,
  EventEmitter as CollectionsEventEmitter,
} from '../Collections/Collections';
import Observable from '../Observable/Observable';

class ObservableAdapter extends Observable {}

export default class Collection<G extends OriginalResource<any>> extends OriginalCollection<G> {
  protected observable: ObservableAdapter = new ObservableAdapter();
  protected eventEmitter: CollectionsEventEmitter<G> = new CollectionsEventEmitter(
    this,
    this.observable,
  );

  constructor(path: string = '', type: new (data: any) => G) {
    super(path, type);
  }

  public useWatcher = <G>(observedScope: () => Promise<G>, options?: any) =>
    this.observable.useWatcher(observedScope, {
      observedChanges: (changes: any) => {
        if (changes?.constructor?.name === 'Array' && changes.length > 1) {
          return changes.map((e: any) => e?.id || e);
        }
        return changes;
      },
      ...options,
    });
  public useEvent = this.observable.useWatcher.bind(this.observable);

  public addWatcher = this.observable.addWatcher.bind(this.observable);
  public removeWatcher = this.observable.removeWatcher.bind(this.observable);
  public addEventListener = this.observable.addWatcher.bind(this.observable);
  public removeEventListener = this.observable.removeWatcher.bind(this.observable);
}

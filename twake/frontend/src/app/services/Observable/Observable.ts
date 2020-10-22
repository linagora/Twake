import { useEffect, useMemo, useState } from 'react';

/**
 * Observable service
 * Allow any service to be listened and component to be updated when this service notify.
 * As a service just extends this class and call this.notify() when update was made.
 * As a component just call ServiceName.useWatcher(()=>ServiceName.store.status) //Only changes to store.status will trigger a change.
 */

type Watcher = {
  callback: (transform: any) => void;
  observedChanges: () => any;
  savedChanges: any;
  options?: any;
};

export default class Observable {
  private watchers: Watcher[] = [];

  constructor() {
    this.addWatcher = this.addWatcher.bind(this);
    this.notify = this.notify.bind(this);
    this.removeWatcher = this.removeWatcher.bind(this);
  }

  useWatcher<G>(observedChanges: () => Promise<G>, options?: any): G | undefined {
    const [state, setState] = useState<G>();

    useMemo(() => {
      const watcher = this.addWatcher(setState, observedChanges, options);
      (async () => {
        const changes = await this.getChanges<G>(watcher);
        setState(changes.changes);
      })();
    }, []);

    useEffect(() => {
      //Called on each update
      return () => {
        this.removeWatcher(setState);
      };
    });

    return state;
  }

  notify() {
    this.watchers.forEach(async watcher => {
      const changes = await this.getChanges(watcher);
      if (changes.didChange) {
        //If things changed
        watcher.callback({});
      }
    });
  }

  async getChanges<G>(watcher: Watcher): Promise<{ changes: G; didChange: boolean }> {
    const changes = await watcher.observedChanges();

    if (watcher.savedChanges) {
      const snapshot = JSON.stringify(changes);
      if (watcher.savedChanges === snapshot) {
        return { changes: changes, didChange: false };
      } else {
        watcher.savedChanges = snapshot;
      }
    }

    return { changes: changes, didChange: true };
  }

  addWatcher(
    callback: (transform: any) => void,
    observedChanges: () => any,
    options?: any,
  ): Watcher {
    const watcher = {
      callback: callback,
      observedChanges: observedChanges,
      savedChanges: null,
    };
    this.watchers.push(watcher);
    return watcher;
  }

  removeWatcher(callback: (transform: any) => void) {
    this.watchers = this.watchers.filter(i => i.callback !== callback);
  }
}

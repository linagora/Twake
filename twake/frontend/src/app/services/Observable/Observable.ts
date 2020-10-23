import { useEffect, useMemo, useState } from 'react';
import EventListener from 'events';

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

export default class Observable extends EventListener {
  protected watchers: Watcher[] = [];

  constructor() {
    super();
    this.addWatcher = this.addWatcher.bind(this);
    this.notify = this.notify.bind(this);
    this.removeWatcher = this.removeWatcher.bind(this);
    this.getChanges = this.getChanges.bind(this);
  }

  useWatcher<G>(observedChanges: () => Promise<G>, options?: any): G | undefined {
    const [state, setState] = useState<G>();

    useMemo(async () => {
      console.log(this);
      const watcher = this.addWatcher(setState, observedChanges, options);
      const changes = await this.getChanges<G>(watcher);
      setState(changes.changes);
    }, []);

    useEffect(() => {
      //Called on component unmount
      return () => {
        this.removeWatcher(setState);
      };
    }, []);

    return state;
  }

  notify() {
    this.watchers.forEach(async watcher => {
      const changes = await this.getChanges(watcher);
      if (changes.didChange) {
        //If things changed
        watcher.callback(changes.changes);
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
    if (this.watchers.length === 0) {
      console.log('emit add watcher');
      this.emit('watcher:exists');
    }
    this.watchers.push(watcher);
    return watcher;
  }

  removeWatcher(callback: (transform: any) => void) {
    const lengthBefore = this.watchers.length;
    this.watchers = this.watchers.filter(i => i.callback !== callback);
    if (lengthBefore > 0 && this.watchers.length === 0) {
      console.log('emit remove');
      this.emit('watcher:none');
    }
  }
}

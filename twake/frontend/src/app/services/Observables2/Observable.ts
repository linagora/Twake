import { useEffect, useMemo, useState } from 'react';

type Watcher = {
  callback: (transform: any) => void;
  observedChanges: () => any;
  options?: any;
};
export default class Observable {
  private watchers: Watcher[] = [];

  constructor() {
    this.addWatcher = this.addWatcher.bind(this);
    this.notify = this.notify.bind(this);
    this.removeWatcher = this.removeWatcher.bind(this);
  }

  notify() {
    this.watchers.forEach(value => {
      value.callback({});
    });
  }

  useWatcher<G>(observedChanges: () => Promise<G[]>, options?: any): G[] {
    const [state, setState] = useState<G[]>([]);

    useMemo(() => {
      (async () => {
        const changes = await observedChanges();
        setState(changes);
      })();

      this.addWatcher(
        async () => {
          //Check observed changes
          const changes = await observedChanges();
          //If things changed
          setState(changes);
        },
        observedChanges,
        options,
      );
    }, []);

    useEffect(() => {
      //Called on each update
      return () => {
        this.removeWatcher(setState);
      };
    });

    return state;
  }

  async addWatcher(callback: (transform: any) => void, observedChanges: () => any, options?: any) {
    this.watchers.push({
      callback: callback,
      observedChanges: observedChanges,
    });
  }

  async removeWatcher(callback: (transform: any) => void) {
    this.watchers = this.watchers.filter(i => i.callback !== callback);
  }
}

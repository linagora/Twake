import Numbers from 'app/services/utils/Numbers';
import _ from 'lodash';
import { RecoilState, useRecoilCallback } from 'recoil';

/**
 * This is the hook to work with feed window (from where to where we are looking the messages)
 * useful mostly in case of jumps
 */
type WindowType = { start: string; end: string; reachedStart: boolean; reachedEnd: boolean };
const windows: Map<string, WindowType> = new Map();
(window as any).windows = windows;
export const getListWindow = (key: string) => {
  if (!windows.has(key))
    windows.set(key, { start: '', end: '', reachedEnd: false, reachedStart: false });
  const window = windows.get(key) as WindowType;

  const updateWindowFromIds = (ids: string[]) => {
    const min = ids.reduce((a, b) => Numbers.minTimeuuid(a, b), ids[0]);
    const max = ids.reduce((a, b) => Numbers.maxTimeuuid(a, b), ids[0]);
    if (max !== window.end || min !== window.start) {
      windows.set(key, {
        ...window,
        start: min,
        end: max,
      });
    }
    return windows.get(key);
  };

  const reachEdge = (status: { reachedStart?: boolean; reachedEnd?: boolean }) => {
    windows.set(key, {
      ...window,
      ...status,
    });
    return windows.get(key) as WindowType;
  };

  const isInWindow = (id: string) => {
    return (
      (Numbers.compareTimeuuid(id, window.start) >= 0 || !window.start) &&
      (Numbers.compareTimeuuid(id, window.end) <= 0 || !window.end)
    );
  };

  return {
    window,
    updateWindowFromIds,
    reachEdge,
    isInWindow,
  };
};

export type AddToWindowOptions = {
  atBottom?: boolean; //Messages are new and should be added at the end of the full list
  reachedEnd?: boolean; //We know that we reached the end while adding this messages
  reachedStart?: boolean; //We know that we reached the start while adding this messages
  inWindow?: boolean; //We know that this new messages are in or glued to the current window
};

export type AddToWindowedListOptions<T> = {
  windowKey: string; //The key of the window managing this list
  atom: RecoilState<T[]>; //The atom containing the list
  getId?: (item: T) => string; //A method to get the id
} & AddToWindowOptions;

export type RemoveFromWindowedListOptions<T> = {
  atom: RecoilState<T[]>; //The atom containing the list
  getId?: (item: T) => string; //A method to get the id
};

export const useAddToWindowedList = (companyId: string) => {
  return useRecoilCallback(
    ({ set, snapshot }) =>
      async <T>(items: T[], options: AddToWindowedListOptions<T>) => {
        if (items.length === 0) return;

        const getId = options.getId || ((m: any) => m?.id);

        //Update the current window
        let { window, updateWindowFromIds, reachEdge } = getListWindow(options.windowKey);
        if (options.reachedEnd || options.reachedStart) window = reachEdge(options);
        if ((options.atBottom && window.reachedEnd) || options.inWindow)
          updateWindowFromIds([window.start, window.end, ...items.map(m => getId(m))]);

        const atom = options.atom;
        set(
          atom,
          _.uniqBy([...(snapshot.getLoadable(atom).valueMaybe() || []), ...items], m => getId(m)),
        );
      },
    [companyId],
  );
};

export const useRemoveFromWindowedList = (companyId: string) => {
  return useRecoilCallback(
    ({ set, snapshot }) =>
      async <T>(items: T[], options: RemoveFromWindowedListOptions<T>) => {
        if (items.length === 0) return;

        console.log('addMessage remove: ', items);

        const getId = options.getId || ((m: any) => m?.id);

        const toRemove = items.map(m => getId(m));

        const atom = options.atom;
        const newList = (snapshot.getLoadable(atom).valueMaybe() || []).filter(
          m => !toRemove.includes(getId(m)),
        );

        console.log('addMessage newList: ', newList);

        set(atom, newList);
      },
    [companyId],
  );
};

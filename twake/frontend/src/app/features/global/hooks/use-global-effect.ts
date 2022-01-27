import { isEqual } from 'lodash';

const globalEffectDepsMap = new Map<string, ReadonlyArray<any>>();

export const useGlobalEffect = (key: string, callback: Function, deps: ReadonlyArray<any>) => {
  if (isEqual(globalEffectDepsMap.get(key), deps) === false) {
    globalEffectDepsMap.set(key, deps);
    callback();
  }
};

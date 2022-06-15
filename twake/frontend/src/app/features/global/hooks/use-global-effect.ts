import { isEqual } from 'lodash';
import { useEffect } from 'react';

const globalEffectDepsMap = new Map<string, ReadonlyArray<any>>();

export const flushGlobalEffects = () => {
  globalEffectDepsMap.clear();
};

export const useGlobalEffect = (key: string, callback: Function, deps: ReadonlyArray<any>) => {
  useEffect(() => {
    if (isEqual(globalEffectDepsMap.get(key), deps) === false) {
      globalEffectDepsMap.set(key, deps);
      callback();
    }
  }, deps);
};

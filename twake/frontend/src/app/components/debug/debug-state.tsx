import React from 'react';
import { useRecoilCallback } from 'recoil';

interface TwakeDebugState {
  dumpStateSnapshot?(): void;
  get?(key: string): void;
  getAllAtoms?(): void;
}

const twakeDebugState: TwakeDebugState = {};

const useDebugRecoilState = () => {
  /**
   * Get the value of an atom by key
   *
   * @param {string} key - The key of the atom
   * @returns {void}
   */
  twakeDebugState.get = useRecoilCallback(
    ({ snapshot }) =>
      async (key: string) => {
        const allNodes = Array.from(snapshot.getNodes_UNSTABLE());
        const node = allNodes.find(node => node.key === key);

        if (node) {
          console.debug(key, await snapshot.getPromise(node));
        }
      },
    [],
  );

  /**
   * Dump the current state of the application to a json file
   *
   * @returns {void}
   */
  twakeDebugState.dumpStateSnapshot = useRecoilCallback(
    ({ snapshot }) =>
      async () => {
        const result: Record<string, any> = {
          localStorage: {},
        };

        for (const node of snapshot.getNodes_UNSTABLE()) {
          const value = await snapshot.getPromise(node);

          result[node.key] = value;
        }

        for (const key of Object.keys(window.localStorage)) {
          result.localStorage[key] = window.localStorage.getItem(key);
        }

        const json = JSON.stringify(result, null, 2);
        const blob = new Blob([json], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');

        link.href = url;
        link.download = `twake-state-${new Date().toISOString()}.json`;

        link.click();
        URL.revokeObjectURL(url);
      },
    [],
  );

  /**
   * lists the value of all atoms
   *
   * @returns {void}
   */
  twakeDebugState.getAllAtoms = useRecoilCallback(
    ({ snapshot }) =>
      async () => {
        for (const node of snapshot.getNodes_UNSTABLE()) {
          const value = await snapshot.getPromise(node);

          console.debug(node.key, value);
        }
      },
    [],
  );

  (window as any).twakeDebugState = twakeDebugState;
};


export default (): React.ReactElement => {
  useDebugRecoilState();

  return <></>;
};

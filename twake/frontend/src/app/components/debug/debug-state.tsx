import React from 'react';
import { useRecoilCallback } from 'recoil';
import EnvironmentService from '../../features/global/framework/environment-service';

interface TwakeDebugState {
  dumpStateSnapshot?(): void;
  get?(key: string): void;
  getAllAtoms?(): void;
}

const twakeDebugState: TwakeDebugState = {};

export default (): React.ReactElement => {
  if (EnvironmentService.isProduction()) return <></>;

  /**
   * lists the value of all atoms
   *
   * @memberof TwakeDebugState
   * @returns {void}
   */
  twakeDebugState.getAllAtoms = useRecoilCallback(
    ({ snapshot }) =>
      async () => {
        console.debug('Atom values:');
        for (const node of snapshot.getNodes_UNSTABLE()) {
          const value = await snapshot.getPromise(node);

          console.debug(node.key, value);
        }
      },
    [],
  );

  /**
   * Get the value of an atom by key
   *
   * @param {string} key - The key of the atom
   * @memberof TwakeDebugState
   * @returns {void}
   */
  twakeDebugState.get = useRecoilCallback(
    ({ snapshot }) =>
      async (key: string) => {
        const allNodes = Array.from(snapshot.getNodes_UNSTABLE());
        const node = allNodes.find(node => node.key === key);

        if (node) {
          const value = await snapshot.getPromise(node);

          console.debug(key, value);
        }
      },
    [],
  );

  /**
   * Dump the current state of the application to a json file
   *
   * @memberof TwakeDebugState
   * @returns {void}
   */
  twakeDebugState.dumpStateSnapshot = useRecoilCallback(
    ({ snapshot }) =>
      async () => {
        const result: Record<string, any> = {};

        for (const node of snapshot.getNodes_UNSTABLE()) {
          const value = await snapshot.getPromise(node);

          result[node.key] = value;
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

  (window as any).twakeDebugState = twakeDebugState;

  return <></>;
};

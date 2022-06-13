export interface TwakeDebugState {
  dumpStateSnapshot?(): void;
  get?(key: string): void;
  getAllAtoms?(): void;
}
